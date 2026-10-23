import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Online Broker Uganda — Find your place',description:'Find rental homes in Uganda, submit a property and connect directly with owners.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
