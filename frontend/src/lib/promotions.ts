export const PERMANENT_BANNER_ID='ballanki-permanent';
export interface PromotionBanner {id:string;title:string;image:string;href:string;active:boolean;}
export interface PromotionsDocument {revision:number;banners:PromotionBanner[];}
export const permanentBanner:PromotionBanner={id:PERMANENT_BANNER_ID,title:'Ballanki A1 Furnitures — Furniture made for your home',image:'/images/banners/ballanki-evergreen.svg',href:'/customer/products',active:true};
