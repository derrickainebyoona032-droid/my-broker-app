import { getChatGPTUser,chatGPTSignInPath } from '../chatgpt-auth';
import { isAdmin } from '../../lib/api';
import Dashboard from '../owners/dashboard';
export const dynamic='force-dynamic';
export default async function Review(){
 const user=await getChatGPTUser();
 return <main className="workspace"><nav><a className="brand" href="/"><span className="mark">ob.</span> Online Broker</a><a href="/owners">My properties</a><a href="/browse.html">Find a home</a></nav><h1>Review property submissions</h1>
 {!user?<section className="panel"><p>Sign in with the site operator’s account to review listings.</p><a className="pill" href={chatGPTSignInPath('/review')} target="_top">Sign in ↗</a></section>:isAdmin(user,'derrickainebyoona032@gmail.com')?<><p>Check property details, photo permission, owner authority and contact details before approving. Approval makes the listing and owner contact public.</p><Dashboard reviewMode/></>:<p className="notice">This area is for the site operator. <a href="/owners">Manage your own properties here.</a></p>}
 </main>;
}
