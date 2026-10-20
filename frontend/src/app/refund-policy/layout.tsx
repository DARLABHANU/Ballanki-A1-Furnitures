import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){const b=await readBranding();return pageMetadata(b,'/refund-policy','Returns & Refund Policy'+' | '+b.siteName,'Read the return and refund policy before ordering furniture from Ballanki A1 Furnitures.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
