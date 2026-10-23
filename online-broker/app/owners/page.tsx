import { getChatGPTUser,chatGPTSignInPath,chatGPTSignOutPath } from '../chatgpt-auth';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export default async function Owners(){
  const user=await getChatGPTUser();
  return <main className="workspace"><nav><a className="brand" href="/"><span className="mark">ob.</span> Online Broker</a><a href="/browse.html">Find a home</a><a href="/review">Review listings</a>{user&&<a href={chatGPTSignOutPath('/owners')} target="_top">Sign out</a>}</nav>
    <p className="eyebrow" style={{marginTop:40}}>FOR PROPERTY OWNERS</p><h1>Your property.<br/>Someone’s next beginning.</h1>
    <p className="lead">Submit your rental with a genuine photo, clear tenancy terms and your approved contact details. We review submissions before publication. You can update availability or withdraw your listing here.</p>
    {user?<><p>Signed in as {user.displayName}.</p><Dashboard/></>:<section className="panel"><h2>List and manage your homes</h2><p>Sign in with ChatGPT to submit properties and return to manage them. Browsing homes needs no account.</p><a className="pill" href={chatGPTSignInPath('/owners')} target="_top">Sign in to submit ↗</a></section>}
    <p>Need help? <a href="https://wa.me/256701897800" target="_blank" rel="noopener noreferrer">WhatsApp support: 0701897800 ↗</a></p>
  </main>;
}
