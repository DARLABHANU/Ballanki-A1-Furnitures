import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){return pageMetadata(await readBranding(),'/customer/products','Shop Wooden Furniture | Ballanki A1 Furnitures','Browse published Ballanki furniture, compare prices and availability, and chat with the store about chairs, beds, dining sets and more.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
