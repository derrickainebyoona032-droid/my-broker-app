import { validateListing, imageType } from './listing.mjs';

type User = {userId:string; email:string; displayName?:string} | null;
type Context = {db?:D1Database; bucket?:R2Bucket; user:User; adminEmail:string};
type Row = {id:string; owner_id:string; data:string; review:string; feedback:string; created_at:string; updated_at:string};
class HttpError extends Error { status:number; constructor(status:number, message:string) { super(message); this.status=status; } }
const json = (data:unknown, status=200) => Response.json(data, {status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function fail(status:number, message:string):never {throw new HttpError(status,message);}
export const isAdmin = (user:User,email:string) => !!user && user.email.toLowerCase() === email.toLowerCase();
function record(row:Row, privateView=false) {
  const data = JSON.parse(row.data);
  const value = {...data,id:row.id,photo:'/api/photos/'+data.photoId,example:false};
  delete value.consent;
  delete value.photoId;
  if (privateView) Object.assign(value,{photoId:data.photoId,review:row.review,feedback:row.feedback,version:row.updated_at});
  return value;
}
async function body(request:Request,max:number) {
  if (Number(request.headers.get('Content-Length')) > max) fail(413,'The upload is too large.');
  const reader=request.body?.getReader(); let length=0; const parts:Uint8Array[]=[];
  if (!reader) return new Uint8Array();
  while (true) {
    const {done,value}=await reader.read(); if(done) break;
    length+=value.length; if(length>max){await reader.cancel();fail(413,'The upload is too large.');}
    parts.push(value);
  }
  const data=new Uint8Array(length);let offset=0;for(const part of parts){data.set(part,offset);offset+=part.length;}return data;
}
async function payload(request:Request) {
  if (!request.headers.get('Content-Type')?.includes('application/json')) fail(415,'Send property details as JSON.');
  try {return JSON.parse(new TextDecoder().decode(await body(request,32768)));} catch(e) {if(e instanceof HttpError)throw e;return fail(400,'The property details could not be read.');}
}
export async function handleApi(request:Request,ctx:Context):Promise<Response> {
  try {
    const url=new URL(request.url), path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean);
    const admin=isAdmin(ctx.user,ctx.adminEmail);
    if(request.method!=='GET') {
      if(request.headers.get('Origin')!==url.origin) fail(403,'Please submit from this website.');
      if(!ctx.user) fail(401,'Sign in to manage properties.');
    }
    if(path[0]==='session' && request.method==='GET') return json({user:ctx.user?{displayName:ctx.user.displayName||ctx.user.email}:null,admin});
    if(!ctx.db || !ctx.bucket) fail(503,'Property submissions are temporarily unavailable. Please try again later.');
    const db=ctx.db, bucket=ctx.bucket;
    if(path[0]==='listings' && path.length===1 && request.method==='GET') {
      const rows=await db.prepare("SELECT * FROM properties WHERE review = 'approved' ORDER BY updated_at DESC LIMIT 500").all<Row>();
      return json({listings:rows.results.map(row=>record(row))});
    }
    if(path[0]==='mine' && request.method==='GET') {
      if(!ctx.user) fail(401,'Sign in to view your properties.');
      const rows=await db.prepare('SELECT * FROM properties WHERE owner_id = ? ORDER BY updated_at DESC LIMIT 100').bind(ctx.user.userId).all<Row>();
      return json({listings:rows.results.map(row=>record(row,true))});
    }
    if(path[0]==='review' && request.method==='GET') {
      if(!admin) fail(403,'Only the site operator can review submissions.');
      const rows=await db.prepare("SELECT * FROM properties WHERE review = 'pending' ORDER BY created_at LIMIT 100").all<Row>();
      return json({listings:rows.results.map(row=>record(row,true))});
    }
    if(path[0]==='photos' && path.length===1 && request.method==='POST') {
      const owner=ctx.user!.userId;
      const count=await db.prepare('SELECT COUNT(*) AS total FROM photos WHERE owner_id = ?').bind(owner).first<{total:number}>();
      if((count?.total||0)>=60) fail(429,'Your photo limit has been reached. Contact support to remove old uploads.');
      const bytes=await body(request,5*1024*1024);
      const mime=imageType(bytes);
      if(!mime || mime!==request.headers.get('Content-Type')) fail(415,'Upload a JPEG, PNG or WebP photo up to 5 MB.');
      const id=crypto.randomUUID(),created=new Date().toISOString();
      await bucket.put(id,bytes,{httpMetadata:{contentType:mime}});
      try {await db.prepare('INSERT INTO photos (id,owner_id,mime,created_at) VALUES (?,?,?,?)').bind(id,owner,mime,created).run();}
      catch(e){await bucket.delete(id);throw e;}
      return json({id,url:'/api/photos/'+id},201);
    }
    if(path[0]==='photos' && path.length===2 && request.method==='GET') {
      const photo=await db.prepare('SELECT * FROM photos WHERE id = ?').bind(path[1]).first<{owner_id:string;mime:string}>();
      if(!photo) fail(404,'Photo not found.');
      const publicUse=await db.prepare("SELECT id FROM properties WHERE review = 'approved' AND json_extract(data, '$.photoId') = ? LIMIT 1").bind(path[1]).first();
      if(!publicUse && !admin && ctx.user?.userId!==photo.owner_id) fail(404,'Photo not found.');
      const object=await bucket.get(path[1]);if(!object)fail(404,'Photo not found.');
      return new Response(object.body,{headers:{'Content-Type':photo.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    }
    if(path[0]==='listings' && ((path.length===1 && request.method==='POST') || (path.length===2 && request.method==='PUT'))) {
      const owner=ctx.user!.userId,input=await payload(request);
      let data;
      try{data=validateListing(input);}catch(e){fail(400,e instanceof Error?e.message:'Check the property details.');}
      const photo=await db.prepare('SELECT owner_id FROM photos WHERE id = ?').bind(data.photoId).first<{owner_id:string}>();
      if(!photo || photo.owner_id!==owner) fail(400,'Upload your own property photo.');
      const now=new Date().toISOString();
      if(request.method==='POST') {
        const count=await db.prepare('SELECT COUNT(*) AS total FROM properties WHERE owner_id = ?').bind(owner).first<{total:number}>();
        if((count?.total||0)>=20) fail(429,'You can manage up to 20 properties. Contact support for more.');
        const id=crypto.randomUUID();
        await db.prepare("INSERT INTO properties (id,owner_id,data,review,feedback,created_at,updated_at) VALUES (?,?,?,'pending','',?,?)").bind(id,owner,JSON.stringify(data),now,now).run();
        return json({id,message:'Submitted for review. Your property will appear after approval.'},201);
      }
      const existing=await db.prepare('SELECT * FROM properties WHERE id = ? AND owner_id = ?').bind(path[1],owner).first<Row>();
      if(!existing) fail(404,'Property not found.');
      if(input.version!==existing.updated_at) fail(409,'This property changed. Refresh before saving again.');
      const result=await db.prepare("UPDATE properties SET data = ?, review = 'pending', feedback = '', updated_at = ? WHERE id = ? AND owner_id = ? AND updated_at = ?").bind(JSON.stringify(data),now,path[1],owner,input.version).run();
      if(!result.meta.changes) fail(409,'This property changed. Refresh before saving again.');
      return json({message:'Changes submitted for review. The previous listing is hidden until approval.'});
    }
    if(path[0]==='listings' && path.length===3 && path[2]==='withdraw' && request.method==='POST') {
      const input=await payload(request);
      const result=await db.prepare("UPDATE properties SET review = 'withdrawn', updated_at = ? WHERE id = ? AND owner_id = ? AND updated_at = ?").bind(new Date().toISOString(),path[1],ctx.user!.userId,input.version||'').run();
      if(!result.meta.changes) fail(409,'This property changed or is not yours. Refresh before trying again.');
      return json({message:'Property withdrawn from the directory.'});
    }
    if(path[0]==='review' && path.length===2 && request.method==='POST') {
      if(!admin) fail(403,'Only the site operator can review submissions.');
      const input=await payload(request);
      if(!['approved','rejected'].includes(input.review)) fail(400,'Choose approve or request changes.');
      const feedback=typeof input.feedback==='string'?input.feedback.trim():'';
      if(feedback.length>1000 || (input.review==='rejected' && !feedback)) fail(400,'Provide feedback up to 1,000 characters.');
      const result=await db.prepare("UPDATE properties SET review = ?, feedback = ?, updated_at = ? WHERE id = ? AND review = 'pending' AND updated_at = ?").bind(input.review,feedback,new Date().toISOString(),path[1],input.version||'').run();
      if(!result.meta.changes) fail(409,'This submission changed. Refresh before reviewing again.');
      return json({message:input.review==='approved'?'Property approved and published.':'Feedback sent to the owner dashboard.'});
    }
    return json({error:'Not found.'},404);
  } catch(e) {
    if(e instanceof HttpError)return json({error:e.message},e.status);
    console.error('Property API failed',e instanceof Error?e.message:'Unknown error');
    return json({error:'The service is temporarily unavailable. Your changes have not been confirmed; please refresh before retrying.'},503);
  }
}
