import type {Metadata} from 'next';
import {cache} from 'react';
import {notFound} from 'next/navigation';
import {readBranding} from '@/lib/serverBranding';
import {pageMetadata,jsonLd} from '@/lib/seo';
const getProduct=cache(async(id:string)=>{if(!/^[a-f0-9]{24}$/i.test(id))notFound();let r:Response;try{r=await fetch((process.env.BACKEND_URL||'http://127.0.0.1:8000').replace(/\/$/,'')+'/api/v1/products/'+encodeURIComponent(id),{next:{revalidate:60},signal:AbortSignal.timeout(4000)});}catch{return null;}if(r.status===404)notFound();return r.ok?r.json():null;});
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{
 const {id}=await params;const [b,p]=await Promise.all([readBranding(),getProduct(id)]);
 if(!p)return {title:'Furniture | '+b.siteName};
 const description=String(p.short_description||p.description||b.seoMeta).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').slice(0,160);
 const images=(p.images||[]).map((i:any)=>typeof i==='string'?i:i.url).filter(Boolean);
 const metadata=pageMetadata(b,'/customer/products/'+id,p.name+' | '+b.siteName,description);
 return {...metadata,openGraph:{...metadata.openGraph,images:images.length?images:undefined},twitter:{card:'summary_large_image',title:p.name+' | '+b.siteName,description,images}};
}
export default async function ProductLayout({children,params}:{children:React.ReactNode;params:Promise<{id:string}>}){
 const {id}=await params;const [b,p]=await Promise.all([readBranding(),getProduct(id)]);if(!p)return children;
 const url=b.siteUrl+'/customer/products/'+id;
 const product={'@context':'https://schema.org','@type':'Product',name:p.name,description:p.short_description||p.description||undefined,image:(p.images||[]).map((i:any)=>typeof i==='string'?i:i.url).filter(Boolean),sku:p.sku||undefined,material:p.material||undefined,category:p.main_category||undefined,url,...(Number.isFinite(p.price)&&p.price>0?{offers:{'@type':'Offer',url,priceCurrency:'INR',price:p.price,availability:'https://schema.org/'+(p.stock_quantity>0?'InStock':p.allow_pre_order?'PreOrder':'OutOfStock'),itemCondition:'https://schema.org/NewCondition',seller:{'@type':'Organization',name:b.siteName}}}:{})};
 const breadcrumb={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:b.siteUrl},{'@type':'ListItem',position:2,name:'Furniture',item:b.siteUrl+'/customer/products'},{'@type':'ListItem',position:3,name:p.name,item:url}]};
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(product)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd(breadcrumb)}}/>{children}</>;
}
