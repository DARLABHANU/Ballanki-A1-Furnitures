import {readBranding} from '@/lib/serverBranding';
import {pageMetadata} from '@/lib/seo';
export async function generateMetadata(){return pageMetadata(await readBranding(),'/contact','Contact Ballanki A1 Furnitures | Furniture Enquiries','Contact Ballanki A1 Furnitures for product, material, order and delivery enquiries. Chat with the store about furniture for your home.');}
export default function Layout({children}:{children:React.ReactNode}){return children;}
