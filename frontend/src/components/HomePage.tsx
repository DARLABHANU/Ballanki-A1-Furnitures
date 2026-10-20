"use client";
import {useBranding} from "@/store/brandingStore";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Heart, Loader2, MapPin, Menu, MessageCircle, Package, Search, ShoppingBag, User, X } from "lucide-react";
import toast from "react-hot-toast";
import {categoryBrowserHref} from "@/lib/furnitureCategories";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { formatPrice, getApiError, getProductImage } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import NotificationBell from "@/components/NotificationBell";


import {useFurnitureCatalog} from "@/store/catalogStore";

const PAGE_SIZE=24;

export default function HomePage({children,initialProducts=[]}:{children?:React.ReactNode;initialProducts?:Product[]}){
  const brand=useBranding();
  const router=useRouter();
  const catalog=useFurnitureCatalog();
  const categories=[{name:"All furniture",slug:"",image:"/images/categories/all.jpg"},...catalog.categories.map(c=>({...c,slug:c.id}))];
  const {isAuthenticated,role}=useAuthStore();
  const {cart,fetchCart}=useCartStore();
  const {wishlistIds,toggleWishlist,fetchWishlist}=useWishlistStore();
  const {location,openModal}=useDeliveryLocationStore();
  const [query,setQuery]=useState("");
  const [menuOpen,setMenuOpen]=useState(false);
  const [products,setProducts]=useState<Product[]>(initialProducts);
  const [loading,setLoading]=useState(!initialProducts.length);
  const [error,setError]=useState("");
  const [page,setPage]=useState(1);
  const [hasMore,setHasMore]=useState(false);
  const [saving,setSaving]=useState<string|number|null>(null);
  const categoryRail=useRef<HTMLDivElement>(null);
  const menuRef=useRef<HTMLDivElement>(null);
  const mounted=useRef(false);
  const productRequest=useRef<AbortController|null>(null);
  const fetchPage=useCallback(async(nextPage:number)=>{
    productRequest.current?.abort();
    const controller=new AbortController();productRequest.current=controller;
    setLoading(true);setError("");
    try{const {data}=await productApi.list({page:nextPage,page_size:PAGE_SIZE,sort_by:"created_at",sort_order:"desc"},controller.signal);if(!mounted.current||controller.signal.aborted)return;const rows:Product[]=data.items||[];setProducts(previous=>nextPage===1?rows:[...previous,...rows.filter(row=>!previous.some(p=>String(p.id)===String(row.id)))]);setPage(nextPage);setHasMore(nextPage<(data.pages||1));}
    catch(e){if(mounted.current&&!controller.signal.aborted)setError(getApiError(e));}
    finally{if(mounted.current&&!controller.signal.aborted)setLoading(false);}
  },[]);
  useEffect(()=>{mounted.current=true;void fetchPage(1);const coupon=new URLSearchParams(window.location.search).get("coupon");if(coupon)Cookies.set("affiliate_coupon",coupon,{expires:7,sameSite:"Lax"});return()=>{mounted.current=false;productRequest.current?.abort();};},[fetchPage]);
  useEffect(()=>{if(isAuthenticated){void fetchCart();void fetchWishlist();}},[isAuthenticated,fetchCart,fetchWishlist]);
  useEffect(()=>{if(!menuOpen)return;const outside=(e:PointerEvent)=>{if(!menuRef.current?.contains(e.target as Node))setMenuOpen(false);};const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setMenuOpen(false);};document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);return()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);};},[menuOpen]);
  const account= !isAuthenticated?"/auth/login":role==="admin"?"/admin/dashboard":"/customer/profile";
  const search=(event:React.FormEvent)=>{event.preventDefault();router.push(query.trim()?`/customer/products?search=${encodeURIComponent(query.trim())}`:"/customer/products");};
  const wishlist=async(product:Product)=>{if(!isAuthenticated){toast.error("Sign in to save furniture");return;}if(saving!==null)return;setSaving(product.id);try{const added=await toggleWishlist(product.id);toast.success(added?"Saved to wishlist":"Removed from wishlist");}catch(e){toast.error(getApiError(e));}finally{setSaving(null);}};
  const scrollCategories=(direction:number)=>{const rail=categoryRail.current;if(rail)rail.scrollBy({left:direction*rail.clientWidth*0.8,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});};

  return <div className="marketplace-home min-h-screen bg-white font-inter text-[#123337]">
    <header className="sticky top-0 z-50 border-b border-[#e5e9eb] bg-white">
      <div className="mx-auto max-w-[1320px] px-3 sm:px-6 lg:px-8">
        <div className="flex h-[66px] items-center gap-2 sm:gap-4 lg:h-20">
          <div ref={menuRef} className="relative lg:hidden"><button type="button" aria-label={menuOpen?"Close menu":"Open menu"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(v=>!v)} className="grid h-10 w-8 place-items-center">{menuOpen?<X size={21}/>:<Menu size={21}/>}</button>{menuOpen&&<nav aria-label="Shopping menu" className="absolute left-0 top-12 w-60 rounded-lg border bg-white p-2 shadow-lg">{[{href:"/customer/products",text:"Browse furniture"},{href:"/customer/orders",text:"My orders"},{href:"/customer/wishlist",text:"Wishlist"},{href:"/customer/cart",text:"Shopping cart"},{href:account,text:isAuthenticated?"My account":"Login / Sign up"},{href:"/contact",text:"Contact the store"}].map(item=><Link key={item.href} onClick={()=>setMenuOpen(false)} href={item.href} className="block rounded px-3 py-3 text-sm hover:bg-slate-50">{item.text}</Link>)}</nav>}</div>
          <Link href="/" aria-label={`${brand.siteName} home`} className="shrink-0"><img src={brand.logoUrl||"/logo.png"} alt={brand.siteName} className="h-11 w-[64px] object-contain sm:h-14 sm:w-[90px]"/></Link>
          <button type="button" onClick={openModal} className="ml-auto flex min-w-0 max-w-[190px] items-center gap-1.5 text-left lg:ml-0 lg:max-w-[210px] lg:rounded-md lg:border lg:px-3 lg:py-3"><MapPin size={15} className="shrink-0"/><span className="truncate text-[10px] font-medium sm:text-xs">{location?`${location.city}, ${location.state}`:"Select location"}</span><ChevronDown size={14} className="shrink-0"/></button>
          <form role="search" aria-label="Desktop furniture search" onSubmit={search} className="hidden min-w-0 flex-1 lg:flex"><input aria-label="Search furniture" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find sofas, chairs, beds and more" className="h-12 min-w-0 flex-1 rounded-l-md border-2 border-r-0 border-[#123337] bg-white px-4 text-sm outline-none focus:bg-slate-50"/><button type="submit" aria-label="Search" className="grid h-12 w-14 place-items-center rounded-r-md bg-[#123337] text-white"><Search size={23}/></button></form>
          <div className="flex shrink-0 items-center gap-1 lg:gap-3"><NotificationBell/><Link href="/customer/wishlist" aria-label={`Wishlist, ${wishlistIds.length} items`} className="relative hidden p-2 sm:block"><Heart size={23}/>{wishlistIds.length>0&&<span className="absolute -right-1 -top-1 rounded-full bg-[#315b49] px-1.5 text-[10px] text-white">{wishlistIds.length}</span>}</Link><Link href="/customer/cart" aria-label={`Cart, ${cart.item_count||0} items`} className="relative p-1.5 lg:p-2"><ShoppingBag size={21}/>{cart.item_count>0&&<span className="absolute -right-1 -top-1 rounded-full bg-[#315b49] px-1.5 text-[10px] text-white">{cart.item_count}</span>}</Link><Link href={account} className="hidden min-h-10 items-center gap-2 whitespace-nowrap border-b-2 border-[#123337] px-1 text-sm font-semibold lg:inline-flex"><User size={18}/>{isAuthenticated?"My account":"Login / Sign up"}</Link></div>
        </div>
        <form role="search" aria-label="Mobile furniture search" onSubmit={search} className="mb-3 flex min-w-0 items-center rounded-md border border-[#123337] lg:hidden"><Search size={19} className="ml-3 shrink-0"/><input aria-label="Search furniture" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search sofas, beds, tables…" className="h-11 min-w-0 flex-1 rounded-md bg-transparent px-2.5 text-sm outline-none"/><button type="submit" aria-label="Search" className="grid h-11 w-11 shrink-0 place-items-center"><ArrowRight size={19}/></button></form>
      </div>
    </header>

    <main className="mx-auto max-w-[1320px] px-3 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-8">
      <section aria-label="Furniture categories" className="mb-6 border-b border-[#e9ecee] pb-4 sm:mb-8 sm:pb-6">
        <div className="mb-4 flex items-center justify-between gap-3"><h1 className="font-inter text-sm font-semibold sm:text-base">Explore furniture at {brand.siteName}</h1><div className="flex gap-1"><button type="button" aria-label="Previous categories" onClick={()=>scrollCategories(-1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#e2e7e8] hover:bg-slate-50"><ChevronLeft size={17}/></button><button type="button" aria-label="More categories" onClick={()=>scrollCategories(1)} className="grid h-8 w-8 place-items-center rounded-full border border-[#e2e7e8] hover:bg-slate-50"><ChevronRight size={17}/></button></div></div>
        <div role="status" className="mb-2 text-xs text-[#63777a]">{catalog.loading?"Loading categories…":catalog.error?<button onClick={()=>void catalog.refresh(true)} className="underline">{catalog.error}</button>:null}</div><div ref={categoryRail} tabIndex={0} aria-label="All furniture categories, swipe to explore" className="grid auto-cols-[68px] grid-flow-col grid-rows-2 scrollbar-none gap-x-3 gap-y-5 overflow-x-auto overscroll-x-contain pb-2 sm:auto-cols-[90px] sm:gap-x-5 lg:auto-cols-[108px] lg:gap-x-4">{categories.map(({name,slug,image})=><Link key={name} href={categoryBrowserHref(slug)} className="group flex flex-col items-center gap-1.5 text-center"><span className="block h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-[#f5f7f6] transition-transform group-hover:-translate-y-0.5 sm:h-16 sm:w-16"><img src={image||"/placeholder-product.svg"} alt="" width={64} height={64} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" onError={event=>{const img=event.currentTarget;if(!img.dataset.fallback){img.dataset.fallback="true";img.src="/placeholder-product.svg";}}}/></span><span className="max-w-full text-[10px] font-medium leading-3 sm:text-xs sm:leading-4">{name}</span></Link>)}</div>
      </section>

      <section aria-labelledby="fresh-heading"><div className="mb-4 flex items-center justify-between gap-3 sm:mb-5"><h2 id="fresh-heading" className="font-inter text-lg font-medium tracking-tight sm:text-2xl">Fresh recommendations</h2><Link href="/customer/products" className="inline-flex min-h-10 items-center gap-1 text-[11px] font-semibold underline underline-offset-4 sm:text-xs">View all<ArrowRight size={14}/></Link></div>
        {error&&<div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 p-4 text-sm"><p>Couldn’t load the collection. Please try again.</p><button type="button" onClick={()=>void fetchPage(products.length?page+1:1)} className="font-semibold underline">Try again</button></div>}
        <div className="grid grid-cols-2 items-stretch gap-2.5 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">{products.map(product=>{const saved=wishlistIds.includes(product.id);const ready=product.stock_quantity>0;return <article key={product.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-md border border-[#dce2e4] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.14)] transition-shadow duration-200 hover:shadow-[0_6px_18px_rgba(0,0,0,0.20)]">
          <div className="relative aspect-square overflow-hidden bg-[#f5f6f7]"><Link href={`/customer/products/${product.id}`} aria-label={`View ${product.name}`} className="block h-full"><img src={getProductImage(product.images)} alt={product.name} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/placeholder-product.svg";}} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"/></Link><button type="button" aria-label={saved?`Remove ${product.name} from wishlist`:`Save ${product.name} to wishlist`} aria-pressed={saved} disabled={saving!==null} onClick={()=>void wishlist(product)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm disabled:opacity-60 sm:h-9 sm:w-9">{saving===product.id?<Loader2 size={17} className="animate-spin"/>:<Heart size={19} fill={saved?"#315b49":"none"} stroke={saved?"#315b49":"#123337"}/>}</button>{product.is_featured&&<span className="absolute bottom-2 left-2 rounded-sm bg-[#e3efe7] px-2 py-1 text-[8px] font-bold tracking-wide sm:text-[9px]">FEATURED</span>}</div>
          <div className="flex flex-1 flex-col p-2.5 sm:p-3.5"><Link href={`/customer/products/${product.id}`} className="block"><p className="text-base font-bold tracking-tight sm:text-xl">{formatPrice(product.price)}</p><h3 className="mt-1 line-clamp-2 font-inter text-xs font-normal leading-5 text-[#4d6266] sm:text-sm">{product.name}</h3></Link><p className="mt-2 truncate text-[9px] text-[#6b7d80] sm:text-[10px]">{product.subcategory||product.category?.name||"Furniture"}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3 text-[9px] sm:text-[10px]"><span className={ready?"text-[#315b49]":"text-[#6b7d80]"}>{ready?`${product.stock_quantity} in stock`:product.allow_pre_order?"Made to order":"Out of stock"}</span>{product.created_at&&!Number.isNaN(Date.parse(product.created_at))&&<time dateTime={product.created_at} className="text-[#7a898c]">{new Date(product.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",timeZone:"UTC"})}</time>}</div></div>
          <div className="grid grid-cols-2 border-t border-[#e8edef] text-[10px] font-medium sm:text-xs"><Link href={`/customer/products/${product.id}`} className="flex min-h-10 items-center justify-center gap-1 border-r border-[#e8edef] hover:bg-slate-50"><Package size={13}/>Details</Link><Link href={`/customer/products/${product.id}?negotiate=1`} className="flex min-h-10 items-center justify-center gap-1 hover:bg-slate-50"><MessageCircle size={13}/>Chat</Link></div>
        </article>;})}
        {loading&&Array.from({length:products.length?4:8},(_,i)=><div key={`loading-${i}`} aria-hidden="true" className="animate-pulse overflow-hidden rounded-md border border-[#e2e7e8]"><div className="aspect-square bg-[#f0f2f3]"/><div className="space-y-3 p-3"><div className="h-4 w-20 rounded bg-slate-100"/><div className="h-3 w-4/5 rounded bg-slate-100"/><div className="h-3 w-1/2 rounded bg-slate-100"/></div></div>)}</div>
        {loading&&<p role="status" className="mt-4 text-center text-xs text-[#6b7d80]">Loading furniture… This may take a moment on your first visit.</p>}
        {!loading&&!error&&!products.length&&<div className="rounded-lg border border-dashed p-10 text-center"><ShoppingBag size={28} className="mx-auto mb-3 text-[#78908a]"/><h3 className="font-inter text-base font-semibold">The collection is coming together</h3><p className="mt-2 text-sm text-[#6b7d80]">Products will appear here when the store publishes them.</p></div>}
        {!loading&&!error&&hasMore&&<div className="mt-8 text-center"><button type="button" onClick={()=>void fetchPage(page+1)} className="min-h-11 rounded border-2 border-[#123337] px-8 text-sm font-semibold hover:bg-[#f2f6f5]">Load more furniture</button></div>}
      </section>
      {children}
    </main>
    <footer className="border-t border-[#e5e9eb] bg-[#f7f9f9] px-4 py-7 text-[#63777a]"><div className="mx-auto flex max-w-[1256px] flex-col justify-between gap-4 text-[11px] sm:flex-row"><p>{brand.footerText||`© ${new Date().getFullYear()} ${brand.siteName}`}</p><nav aria-label="Store information" className="flex flex-wrap gap-x-5 gap-y-3"><Link href="/contact">Contact & support</Link><Link href="/shipping-policy">Delivery</Link><Link href="/refund-policy">Returns</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav></div></footer>
    
  </div>;
}



