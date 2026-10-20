import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){const b=await readBranding();return pageMetadata(b,'/privacy','Privacy Policy'+' | '+b.siteName,'Learn how Ballanki A1 Furnitures handles customer information, accounts and orders.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
