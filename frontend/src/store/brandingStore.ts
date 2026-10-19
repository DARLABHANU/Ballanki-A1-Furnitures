"use client";
import {create} from 'zustand';import {api} from '@/lib/api';
export type Branding={siteName:string;footerText:string;seoTitle:string;seoMeta:string;siteUrl:string;logoUrl:string;socialImage:string;businessName:string;businessAddress:string;supportEmail:string;supportPhone:string;invoiceFooter:string};
export const brandingDefaults:Branding={siteName:'Ballanki A1 Furnitures',footerText:'',seoTitle:'Ballanki A1 Furnitures | Solid Wood Furniture',seoMeta:'Explore wooden furniture, chat with the store and order furniture made for your home.',siteUrl:'https://www.ballankia1furnitures.in',logoUrl:'/logo.png',socialImage:'',businessName:'Ballanki A1 Furnitures',businessAddress:'',supportEmail:'',supportPhone:'',invoiceFooter:'Thank you for shopping with us.'};
let pending:Promise<void>|null=null;
export const useBrandingStore=create<{branding:Branding;refresh:()=>Promise<void>;setBranding:(value:Partial<Branding>)=>void}>((set)=>({branding:brandingDefaults,setBranding:value=>set({branding:{...brandingDefaults,...value}}),refresh:()=>{if(!pending)pending=api.get('/website-settings').then(({data})=>{set({branding:{...brandingDefaults,...data}});}).catch(()=>{}).finally(()=>{pending=null;});return pending;}}));
export const useBranding=()=>useBrandingStore(s=>s.branding);
