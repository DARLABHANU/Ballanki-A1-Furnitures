"use client";
import {useEffect} from 'react';
import {create} from 'zustand';
import {api} from '@/lib/api';

export interface CatalogType {id:string;name:string;value:string;image:string;active:boolean;}
export interface CatalogCategory {id:string;name:string;image:string;active:boolean;solidWoodOnly:boolean;types:CatalogType[];}
export interface CatalogDocument {revision:number;categories:CatalogCategory[];}
let pending:Promise<void>|null=null;
let attemptedAt=0;
export const useCatalogStore=create<{categories:CatalogCategory[];ready:boolean;error:string;refresh:(force?:boolean)=>Promise<void>;publish:(data:CatalogDocument)=>void}>((set)=>({
 categories:[],ready:false,error:'',
 publish:data=>{set({categories:data.categories.filter(c=>c.active).map(c=>({...c,types:c.types.filter(t=>t.active)})),ready:true,error:''});},
 refresh:async(force=false)=>{
  if(pending)return pending;
  if(!force&&Date.now()-attemptedAt<5000)return;
  attemptedAt=Date.now();
  pending=(async()=>{try{const {data}=await api.get<CatalogDocument>('/catalog');if(!Array.isArray(data.categories))throw new Error('Invalid catalog');useCatalogStore.getState().publish(data);}catch{set({error:'Categories could not be refreshed. Please try again.'});}finally{pending=null;}})();
  return pending;
 }
}));
export function useFurnitureCatalog(){
 const store=useCatalogStore();
 useEffect(()=>{
  void store.refresh();
  const refresh=()=>{if(document.visibilityState==='visible')void useCatalogStore.getState().refresh();};
  const changed=(e:StorageEvent)=>{if(e.key==='catalog-updated')void useCatalogStore.getState().refresh(true);};
  const timer=window.setInterval(refresh,30000);
  window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);window.addEventListener('storage',changed);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('storage',changed);};
 },[store.refresh]);
 return {...store,loading:!store.ready&&!store.error};
}
export function catalogTypeHref(category:CatalogCategory,type:CatalogType){const q=new URLSearchParams({category:category.id,type:type.id,subcategory:type.value});if(category.solidWoodOnly)q.set('construction','solid_wood');return `/customer/products?${q}`;}
export function catalogCategoryHref(category:CatalogCategory){const q=new URLSearchParams({category:category.id});if(category.solidWoodOnly)q.set('construction','solid_wood');return `/customer/products?${q}`;}
