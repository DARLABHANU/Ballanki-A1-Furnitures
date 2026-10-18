"use client";
import {Suspense,useEffect,useRef} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {ArrowLeft,ChevronRight,MessageCircle} from 'lucide-react';
import {furnitureCategories,findFurnitureCategory,categoryBrowserHref,categoryProductsHref} from '@/lib/furnitureCategories';
function CategoryBrowser(){
 const params=useSearchParams();
 const selected=findFurnitureCategory(params.get('category'));
 const activeLink=useRef<HTMLAnchorElement>(null),content=useRef<HTMLElement>(null);
 const items=selected.related.map(slug=>findFurnitureCategory(slug));
 useEffect(()=>{activeLink.current?.scrollIntoView({block:'nearest',inline:'nearest'});if(content.current)content.current.scrollTop=0;},[selected.slug]);
 return <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-white font-inter text-[#123337] lg:h-dvh">
  <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#e8edeb] bg-[#f7f9f8] px-4 sm:h-20 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Link href="/" aria-label="Back to home" className="grid h-10 w-9 shrink-0 place-items-center rounded-lg hover:bg-[#eaf1ed]"><ArrowLeft size={25}/></Link><h1 className="font-inter text-xl font-semibold tracking-tight sm:text-2xl">Categories</h1></div><Link href="/customer/products" className="shrink-0 text-xs font-semibold text-[#315b49] hover:underline sm:text-sm">Browse all</Link></header>
  <div className="flex min-h-0 flex-1 overflow-hidden">
   <nav aria-label="Furniture categories" className="w-[104px] shrink-0 overflow-y-auto scrollbar-none overscroll-contain bg-[#eaf2ed] pb-4 sm:w-28">
    {furnitureCategories.map(category=>{const active=category.slug===selected.slug;return <Link key={category.slug||'all'} ref={active?activeLink:undefined} href={categoryBrowserHref(category.slug)} replace scroll={false} aria-current={active?'page':undefined} className={`relative flex min-h-[100px] flex-col items-center justify-center gap-2 px-2 py-3 text-center text-[10px] leading-4 transition-colors sm:min-h-[112px] sm:text-xs ${active?'rounded-l-2xl bg-white font-semibold text-[#214f40]':'font-medium text-[#50675c] hover:bg-white/50'}`}>{active&&<span className="absolute bottom-6 left-0 top-6 w-[3px] rounded-r-full bg-[#214f40]"/>}<img src={category.image} alt="" width={48} height={48} loading="lazy" className="h-11 w-11 rounded-xl object-cover sm:h-12 sm:w-12"/><span className="max-w-full break-words">{category.name}</span>{!active&&<span className="absolute bottom-0 left-3 right-3 h-px bg-[#d5e3da]"/>}</Link>;})}
   </nav>
   <main ref={content} aria-label={`${selected.name} options`} className="min-w-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
    <div className="mb-6 flex items-center gap-4"><h2 className="shrink-0 font-inter text-sm font-semibold sm:text-lg">{selected.name}</h2><span className="h-px flex-1 bg-[#e6ebe8]"/></div>
    <div className="grid grid-cols-2 items-start gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:max-w-5xl lg:grid-cols-5 xl:grid-cols-6">
     {items.map(category=><Link key={category.slug} href={categoryProductsHref(category.slug)} className="group flex min-w-0 flex-col items-center gap-3 text-center"><span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-[#f3f5f4] transition-transform group-hover:scale-105 sm:h-20 sm:w-20 lg:h-24 lg:w-24"><img src={category.image} width={96} height={96} alt="" loading="lazy" className="h-full w-full object-cover"/></span><span className="max-w-[100px] text-[11px] font-semibold leading-4 sm:text-xs sm:leading-5">{category.name}</span></Link>)}
     <Link href={categoryProductsHref(selected.slug)} aria-label={selected.slug?`View all ${selected.name.toLowerCase()}`:'View all furniture'} className="group flex min-w-0 flex-col items-center gap-3 text-center"><span className="grid h-[72px] w-[72px] place-items-center rounded-full bg-[#f3f5f4] text-[#315b49] transition-colors group-hover:bg-[#eaf2ed] sm:h-20 sm:w-20 lg:h-24 lg:w-24"><ChevronRight size={32} strokeWidth={1.7}/></span><span className="text-[11px] font-semibold leading-4 sm:text-xs sm:leading-5">View all</span></Link>
    </div>
    <div className="mt-8 border-t border-[#e6ebe8] pt-5 sm:mt-10"><Link href="/contact" className="inline-flex max-w-full items-center gap-3 rounded-lg border border-[#dce7df] bg-[#f3f7f4] px-3 py-3 text-xs font-medium shadow-sm sm:px-4"><MessageCircle size={18} className="shrink-0 text-[#315b49]"/><span className="leading-5">Need help choosing furniture?<span className="block font-semibold sm:ml-1 sm:inline">Contact the store</span></span><ChevronRight size={17} className="shrink-0"/></Link></div>
   </main>
  </div>
 </div>;
}
export default function CategoriesPage(){return <Suspense fallback={<div className="min-h-dvh bg-white p-6 text-sm text-slate-500" role="status">Loading furniture categories…</div>}><CategoryBrowser/></Suspense>;}
