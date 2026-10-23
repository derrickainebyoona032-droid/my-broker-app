import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {handleApi} from '../lib/api.ts';
const property={title:'Test home',area:'Ntinda',city:'Kampala',type:'Apartment',beds:2,baths:1,rent:850000,size:75,description:'Test only.',advance:'3 months',deposit:'None',utilities:'Separate',amenities:['Parking'],owner:'Test owner',phone:'+256701897800',email:'',availability:'available',lastConfirmed:'2026-10-20',consent:true};
function setup(){
 const sql=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(p=>p.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const db={prepare(query){let args=[];const stmt=sql.prepare(query);return {bind(...values){args=values;return this;},async first(){return stmt.get(...args)||null;},async all(){return {results:stmt.all(...args)};},async run(){return {meta:stmt.run(...args)};}};}};
 const objects=new Map();const bucket={async put(id,bytes){objects.set(id,bytes);},async get(id){return objects.has(id)?{body:objects.get(id)}:null;},async delete(id){objects.delete(id);}};
 const owner={userId:'owner-a',email:'owner@example.test'},other={userId:'owner-b',email:'other@example.test'},admin={userId:'admin',email:'operator@example.test'};
 async function call(path,method='GET',data,user=owner,origin='https://broker.test'){
  const headers={};if(method!=='GET'){headers.Origin=origin;headers['Content-Type']='application/json';}
  const request=new Request('https://broker.test/api/'+path,{method,headers,...(method==='GET'?{}:{body:JSON.stringify(data)})});
  return handleApi(request,{db,bucket,user,adminEmail:admin.email});
 }
 async function upload(user=owner){
  const response=await handleApi(new Request('https://broker.test/api/photos',{method:'POST',headers:{Origin:'https://broker.test','Content-Type':'image/png'},body:Uint8Array.from([137,80,78,71,13,10,26,10,0])}),{db,bucket,user,adminEmail:admin.email});
  assert.equal(response.status,201);return (await response.json()).id;
 }
 return {call,upload,owner,other,admin,sql,db,bucket};
}
test('self-service lifecycle persists, requires approval, and enforces owner/operator permissions',async()=>{
 const s=setup();const photoId=await s.upload();const data={...property,photoId};
 assert.equal((await s.call('listings','POST',data,null)).status,401);
 assert.equal((await s.call('listings','POST',data,s.owner,'https://other.test')).status,403);
 assert.equal((await s.call('listings','POST',data,s.other)).status,400);
 assert.equal((await s.call('listings','POST',{...data,rent:-1})).status,400);
 const created=await s.call('listings','POST',data);assert.equal(created.status,201);const {id}=await created.json();
 assert.equal((await (await s.call('listings')).json()).listings.length,0);
 assert.equal((await s.call('photos/'+photoId,'GET',null,null)).status,404);
 assert.equal((await (await s.call('mine','GET',null,s.other)).json()).listings.length,0);
 assert.equal((await s.call('review','GET',null,s.owner)).status,403);
 let mine=(await (await s.call('mine')).json()).listings[0];
 assert.equal((await s.call('listings/'+id,'PUT',{...data,version:mine.version},s.other)).status,400);
 assert.equal((await s.call('review/'+id,'POST',{review:'approved',version:mine.version},s.owner)).status,403);
 assert.equal((await s.call('review/'+id,'POST',{review:'approved',version:mine.version},s.admin)).status,200);
 const publicData=(await (await s.call('listings','GET',null,null)).json()).listings;
 assert.equal(publicData[0].id,id);assert.equal(publicData[0].ownerId,undefined);assert.equal(publicData[0].consent,undefined);
 assert.equal((await s.call('photos/'+photoId,'GET',null,null)).status,200);
 mine=(await (await s.call('mine')).json()).listings[0];
 assert.equal((await s.call('listings/'+id,'PUT',{...data,title:'Updated home',version:'stale'})).status,409);
 assert.equal((await s.call('listings/'+id,'PUT',{...data,title:'Updated home',version:mine.version})).status,200);
 assert.equal((await (await s.call('listings')).json()).listings.length,0);
 mine=(await (await s.call('mine')).json()).listings[0];
 assert.equal((await s.call('review/'+id,'POST',{review:'rejected',feedback:'',version:mine.version},s.admin)).status,400);
 assert.equal((await s.call('review/'+id,'POST',{review:'rejected',feedback:'Please confirm tenancy terms.',version:mine.version},s.admin)).status,200);
 mine=(await (await s.call('mine')).json()).listings[0];assert.match(mine.feedback,/tenancy/);
 assert.equal((await s.call('listings/'+id,'PUT',{...data,availability:'rented',version:mine.version})).status,200);
 mine=(await (await s.call('mine')).json()).listings[0];assert.equal(mine.availability,'rented');assert.equal(mine.review,'pending');
 assert.equal((await s.call('listings/'+id+'/withdraw','POST',{version:mine.version})).status,200);
 assert.equal((await (await s.call('review','GET',null,s.admin)).json()).listings.length,0);
 s.sql.close();
});
test('invalid photo types, oversize payloads, and missing storage fail clearly',async()=>{
 const s=setup();
 const missing=await handleApi(new Request('https://broker.test/api/listings'),{user:null,adminEmail:'operator@example.test'});assert.equal(missing.status,503);
 const bad=await handleApi(new Request('https://broker.test/api/photos',{method:'POST',headers:{Origin:'https://broker.test','Content-Type':'image/svg+xml'},body:'<svg/>'}),{user:s.owner,db:s.db,bucket:s.bucket,adminEmail:'operator@example.test'});
 assert.equal((await s.call('listings','POST',{description:'a'.repeat(40000)})).status,413);
 assert.equal(bad.status,415);
 s.sql.close();
});
