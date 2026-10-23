'use client';
import {useEffect,useRef,useState} from 'react';
import type {FormEvent} from 'react';
type Property={id:string;title:string;area:string;city:string;type:string;beds:number;baths:number;rent:number;size:number;description:string;advance:string;deposit:string;utilities:string;amenities:string[];owner:string;phone:string;email:string;photo:string;photoId:string;availability:string;lastConfirmed:string;review:string;feedback:string;version:string};
async function api<T={message:string}>(path:string,options?:RequestInit):Promise<T>{
 const response=await fetch('/api/'+path,options);
 const result=await response.json() as T & {error?:string};
 if(!response.ok)throw new Error(result.error||'Please try again.');
 return result;
}
const send=(method:string,data:unknown)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
export default function Dashboard({reviewMode=false}:{reviewMode?:boolean}){
 const [items,setItems]=useState<Property[]>([]),[editing,setEditing]=useState<Property|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState('');
 const formRef=useRef<HTMLFormElement>(null);
 const source=reviewMode?'review':'mine';
 useEffect(()=>{const controller=new AbortController();api<{listings:Property[]}>(source,{signal:controller.signal}).then(data=>setItems(data.listings)).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[source]);
 async function refresh(){const result=await api<{listings:Property[]}>(source);setItems(result.listings);}
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;const form=event.currentTarget;const values=new FormData(form);
  setBusy(true);setError('');setMessage('');
  try{
   let photoId=editing?.photoId;const file=values.get('photo') as File;
   if(file?.size){const uploaded=await api<{id:string}>('photos',{method:'POST',headers:{'Content-Type':file.type},body:file});photoId=uploaded.id;}
   const data:Record<string,unknown>={photoId,version:editing?.version,consent:values.get('consent')==='on'};
   for(const field of ['title','area','city','type','description','advance','deposit','utilities','owner','phone','email','availability','lastConfirmed'])data[field]=values.get(field);
   for(const field of ['beds','baths','rent','size'])data[field]=Number(values.get(field));
   data.amenities=String(values.get('amenities')||'').split(',').map(v=>v.trim()).filter(Boolean);
   const result=await api('listings'+(editing?'/'+editing.id:''),send(editing?'PUT':'POST',data));
   setEditing(null);form.reset();setMessage(result.message);await refresh();
  }catch(e){setError(e instanceof Error?e.message:'Could not submit the property.');}finally{setBusy(false);}
 }
 async function action(path:string,data:unknown){
  if(busy)return;setBusy(true);setError('');setMessage('');
  try{const result=await api(path,send('POST',data));setMessage(result.message);await refresh();}
  catch(e){setError(e instanceof Error?e.message:'Could not save changes.');}finally{setBusy(false);}
 }
 const today=new Date().toISOString().slice(0,10);
 return <>{error&&<p role="alert" className="notice error">{error} <button className="text-button" disabled={busy} onClick={()=>{setError('');refresh().catch(e=>setError(e.message));}}>Refresh listings</button></p>}{message&&<p role="status" className="notice">{message}</p>}
 {!reviewMode&&<section className="panel" id="property-form"><h2>{editing?'Edit property':'Submit a rental property'}</h2><p>Contact details and the photo become public only after approval. Every edit returns the property to review and hides its previous public version.</p>
 <form key={editing?.id||'new'} ref={formRef} onSubmit={submit} className="property-form">
 <label>Property title<input name="title" required maxLength={100} defaultValue={editing?.title}/></label>
 <label>Property type<select name="type" defaultValue={editing?.type||'Apartment'}>{['Apartment','House','Bungalow','Studio','Room'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label>Neighbourhood<input name="area" required maxLength={100} defaultValue={editing?.area}/></label>
 <label>City or town<input name="city" required maxLength={80} defaultValue={editing?.city}/></label>
 <label>Monthly rent (UGX)<input name="rent" type="number" min="1" max="1000000000" step="1" required defaultValue={editing?.rent}/></label>
 <label>Floor area (m²)<input name="size" type="number" min="1" max="100000" step="0.1" required defaultValue={editing?.size}/></label>
 <label>Bedrooms (0 for studio)<input name="beds" type="number" min="0" max="50" required defaultValue={editing?.beds??1}/></label>
 <label>Bathrooms<input name="baths" type="number" min="1" max="50" required defaultValue={editing?.baths??1}/></label>
 <label>Rent in advance<input name="advance" required maxLength={200} placeholder="e.g. 3 months" defaultValue={editing?.advance}/></label>
 <label>Deposit<input name="deposit" required maxLength={200} placeholder="Amount or none" defaultValue={editing?.deposit}/></label>
 <label>Utility costs<input name="utilities" required maxLength={200} placeholder="What is included or paid separately?" defaultValue={editing?.utilities}/></label>
 <label>Availability<select name="availability" defaultValue={editing?.availability||'available'}><option value="available">Available</option><option value="rented">Rented</option><option value="unavailable">Unavailable</option></select></label>
 <label>Availability last confirmed<input type="date" name="lastConfirmed" required max={today} defaultValue={editing?.lastConfirmed||today}/></label>
 <label>Owner or authorised agent name<input name="owner" autoComplete="name" required maxLength={100} defaultValue={editing?.owner}/></label>
 <label>Public phone / WhatsApp<input name="phone" type="tel" maxLength={30} placeholder="0701897800 or +256…" defaultValue={editing?.phone}/></label>
 <label>Public contact email<input name="email" type="email" maxLength={254} defaultValue={editing?.email}/></label>
 <p className="wide">Provide at least one contact method. Tenants will contact you directly; this website does not send rental enquiries.</p>
 <label className="wide">Amenities, separated by commas<input name="amenities" maxLength={1600} placeholder="Parking, water tank, balcony" defaultValue={editing?.amenities.join(', ')}/></label>
 <label className="wide">About the home<textarea name="description" required rows={5} maxLength={3000} defaultValue={editing?.description}/></label>
 <label className="wide">Actual property photo — JPEG, PNG or WebP, up to 5 MB<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required={!editing}/>{editing&&<><img className="photo-preview" src={editing.photo} alt="Current property photo"/><small>Leave empty to keep the current photo.</small></>}</label>
 <label className="wide consent"><input name="consent" type="checkbox" required/>I own this property or have authority to list it. I confirm the details are accurate and permit publication of the photo and contact details. I have permission from anyone whose information or photograph is included.</label>
 <div className="wide actions"><button className="primary" disabled={busy}>{busy?'Saving…':editing?'Submit changes for review':'Submit for review'}</button>{editing&&<button type="button" className="secondary" disabled={busy} onClick={()=>setEditing(null)}>Cancel editing</button>}</div>
 </form></section>}
 <section><h2>{reviewMode?'Awaiting review':'Your properties'}</h2>{loading?<p role="status">Loading properties…</p>:!items.length?<p>No {reviewMode?'pending submissions':'properties submitted'} yet.</p>:items.map(p=><article key={p.id} className="panel listing-panel">
 <img src={p.photo} alt={p.title}/><div><span className="status">{p.review==='rejected'?'Changes requested':p.review}</span><h3>{p.title}</h3><p>{p.area}, {p.city} · UGX {p.rent.toLocaleString()} / month</p>
 <dl><dt>Availability</dt><dd>{p.availability}</dd><dt>Last confirmed</dt><dd>{p.lastConfirmed}</dd>{reviewMode&&<><dt>Type / size</dt><dd>{p.type}, {p.size} m², {p.beds} beds, {p.baths} baths</dd><dt>Advance / deposit</dt><dd>{p.advance} / {p.deposit}</dd><dt>Utilities</dt><dd>{p.utilities}</dd><dt>Amenities</dt><dd>{p.amenities.join(', ')||'None specified'}</dd><dt>Owner contact</dt><dd>{p.owner} · {p.phone||p.email}{p.phone&&p.email?' · '+p.email:''}</dd></>}</dl>
 {reviewMode&&<p>{p.description}</p>}{p.feedback&&<p className="notice">Review feedback: {p.feedback}</p>}
 {reviewMode?<form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const button=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;if(!button?.value){setError('Choose approve or request changes.');return;}action('review/'+p.id,{review:button.value,feedback:data.get('feedback'),version:p.version});}}><label>Feedback for owner<textarea className="review-note" name="feedback" rows={3} maxLength={1000} placeholder="Required when requesting changes"/></label><div className="actions"><button className="primary" name="decision" value="approved" disabled={busy}>Approve and publish</button><button className="secondary" name="decision" value="rejected" disabled={busy}>Request changes</button></div></form>:<div className="actions"><button className="secondary" disabled={busy} onClick={()=>{setEditing(p);setError('');document.getElementById('property-form')?.scrollIntoView({behavior:'smooth'});}}>Edit / update availability</button>{p.review!=='withdrawn'&&<button className="secondary" disabled={busy} onClick={()=>action('listings/'+p.id+'/withdraw',{version:p.version})}>Withdraw listing</button>}{p.review==='approved'&&<a href={'/browse.html#property/'+p.id}>View public listing ↗</a>}</div>}</div>
 </article>)}</section></>;
}
