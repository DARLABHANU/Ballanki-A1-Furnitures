import type {Metadata} from 'next';
export const localTitle='Ballanki A1 Furnitures | Furniture in Anakapalle & Vizag';
export const localDescription='Explore wooden chairs, sofas, beds, dining tables and cupboards at Ballanki A1 Furnitures. Enquire about furniture for your home in Vizag and Anakapalle.';
export function pageMetadata(b:Record<string,string>,path:string,title:string,description:string):Metadata {
 const url=new URL(path,b.siteUrl).href;const image=b.socialImage||b.logoUrl;
 return {title,description,alternates:{canonical:url},openGraph:{title,description,url,siteName:b.siteName,locale:'en_IN',type:'website',images:image?[{url:new URL(image,b.siteUrl).href}]:[]},twitter:{card:'summary_large_image',title,description,images:image?[new URL(image,b.siteUrl).href]:[]}};
}
export function jsonLd(value:unknown){return JSON.stringify(value).replace(/</g,'\\u003c');}

export const storeAddress='Sirasapalli village, Anakapalle mandal, Anakapalle district, Andhra Pradesh, India';
