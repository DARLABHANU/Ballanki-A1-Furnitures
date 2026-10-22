export const PERMANENT_BANNER_ID='ballanki-permanent';
export interface PromotionBanner {id:string;title:string;image:string;href:string;active:boolean;}
export interface PromotionsDocument {revision:number;banners:PromotionBanner[];}
export const permanentBanner:PromotionBanner={id:PERMANENT_BANNER_ID,title:'Ballanki A1 Furnitures — Furniture made for your home',image:'/images/banners/ballanki-evergreen.svg',href:'/customer/products',active:true};

export function readPromotionDocument(value:unknown):PromotionsDocument {
 const doc=value as PromotionsDocument;
 if(!doc||!Number.isInteger(doc.revision)||doc.revision<0||!Array.isArray(doc.banners)||!doc.banners.length||doc.banners.length>12||!doc.banners.some(b=>b?.id===PERMANENT_BANNER_ID&&b.active===true)||doc.banners.some(b=>!b||typeof b.id!=='string'||typeof b.title!=='string'||typeof b.image!=='string'||typeof b.href!=='string'||typeof b.active!=='boolean'))throw new Error('The banner service returned an invalid response. Reload the page or check the backend deployment.');
 return doc;
}
export function promotionLoadError(error:unknown):string {
 const response=(error as {response?:{status?:number;data?:{detail?:unknown;error?:unknown}}})?.response;
 if(response?.status===404)return 'Promotion banners are not available on the backend yet. Deploy the latest backend revision, then reload this page.';
 if(response?.status===401)return 'Your sign-in session has expired. Sign in again to manage banners.';
 if(response?.status===403)return 'Only the store administrator can manage promotion banners.';
 if(response&&response.status&&response.status>=500)return 'The banner service is temporarily unavailable. Please try again.';
 for(const message of [response?.data?.detail,response?.data?.error])if(typeof message==='string'&&message.trim())return message;
 if(error instanceof Error&&!response)return error.message==='Network Error'?'Could not reach the banner service. Check your connection and try again.':error.message;
 return 'Could not load banners. Please try again.';
}

export const BANNER_SIZES='(min-width: 1320px) 1256px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 24px)';
export function optimizedBannerUrl(image:string,width=1440):string {
 try{const u=new URL(image);if(u.protocol!=='https:'||u.hostname!=='res.cloudinary.com'||u.username||u.password)return image;
 const match=u.pathname.match(/^(\/[^/]+\/image\/upload\/)(v\d+\/.+)$/);if(!match)return image;
 const size=Math.max(320,Math.min(1920,Math.round(width)));u.pathname=match[1]+`c_limit,w_${size}/q_auto/f_auto/`+match[2];return u.href;
 }catch{return image;}
}
export function bannerSrcSet(image:string):string|undefined {if(optimizedBannerUrl(image)===image)return undefined;return [480,768,1024,1440,1920].map(width=>`${optimizedBannerUrl(image,width)} ${width}w`).join(', ');}
