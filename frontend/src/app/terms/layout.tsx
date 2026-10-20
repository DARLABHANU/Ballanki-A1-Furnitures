import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){const b=await readBranding();return pageMetadata(b,'/terms','Terms & Conditions'+' | '+b.siteName,'Read the terms for browsing, chatting, ordering and making payments at Ballanki A1 Furnitures.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
