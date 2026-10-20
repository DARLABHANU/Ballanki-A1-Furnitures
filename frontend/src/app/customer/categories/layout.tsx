import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){return pageMetadata(await readBranding(),'/customer/categories','Furniture Categories | Chairs, Beds, Sofas & Dining | Ballanki','Explore Ballanki furniture categories and designs: wooden chairs, beds, sofas, dining tables, cupboards and more.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
