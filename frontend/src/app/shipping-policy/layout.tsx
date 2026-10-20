import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){const b=await readBranding();return pageMetadata(b,'/shipping-policy','Delivery Policy'+' | '+b.siteName,'Read how delivery charges, making time and expected delivery work for furniture orders at Ballanki A1 Furnitures.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
