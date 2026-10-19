import type {MetadataRoute} from 'next';import {readBranding} from '@/lib/serverBranding';
export default async function manifest():Promise<MetadataRoute.Manifest>{const b=await readBranding();return {name:b.siteName,short_name:b.siteName,start_url:'/',scope:'/',display:'standalone',background_color:'#ffffff',theme_color:'#214f40',icons:[{src:b.logoUrl||'/logo.png',sizes:'any',purpose:'any'}]};}
