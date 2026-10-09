"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Heart, Share2, Star, ShoppingBag, Loader2, Truck, MessageSquare, X, ZoomIn, Tag, ShieldCheck, ArrowRight, Minus, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { formatPrice, getProductImage, formatDate, getApiError } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import BargainPanel from "@/components/customer/BargainPanel";
import { api, productApi } from "@/lib/api";
import ProductCard from "@/components/customer/ProductCard";

type DetailProduct = Product & { main_category?: string; brand?: string; fabric?: string; warranty_text?: string; variant_ids?: string[]; bundle_ids?: string[] };
type Review = { id: string; rating: number; comment?: string; user_name: string; created_at?: string; images?: string[] };
type Question = { id: string; question: string; answer: string; user_name: string; created_at: string };
type Coupon = { id: string; code: string; description?: string; discount_type: string; discount_value?: number; discount_amount?: number; min_order_amount?: number; valid_from?: string; valid_until?: string; max_uses?: number; used_count?: number };
const panel = "rounded-xl border border-slate-200 bg-white p-4 sm:p-6";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { location, openModal } = useDeliveryLocationStore();
  const [product, setProduct] = useState<DetailProduct | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [similarPrice, setSimilarPrice] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Product[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [negotiating, setNegotiating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [submitting, setSubmitting] = useState("");
  const [allReviews, setAllReviews] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [questionError, setQuestionError] = useState("");
  const gallery = useRef<HTMLButtonElement>(null);
  const zoomClose = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true); setError(""); setProduct(null); setSelectedImage(0); setQuantity(1);
    setVariants([]); setBundles([]); setSelectedBundle([]); setSimilar([]); setSimilarPrice([]); setReviews([]); setQuestions([]); setReviewError(""); setQuestionError(""); setZoom(false); setAllReviews(false);
    productApi.get(id).then(({data}) => {
      if (!live) return;
      setProduct(data);
      productApi.list({ limit: 5, min_price: Math.floor(data.price*0.75), max_price: Math.ceil(data.price*1.25) }).then(({data:r})=>{if(live)setSimilarPrice((r.items || []).filter((p:Product)=>String(p.id)!==String(id)));}).catch(()=>{});
      productApi.list({ limit: 8, category: data.main_category || data.category?.name }).then(({data:r}) => { if(live)setSimilar((r.items || []).filter((p:Product)=>String(p.id)!==String(id))); }).catch(()=>{});
    }).catch(e=>{if(live)setError(getApiError(e));}).finally(()=>{if(live)setLoading(false);});
    productApi.getReviews(id).then(({data})=>{if(live)setReviews(data.items || []);}).catch(()=>{if(live)setReviewError("Reviews could not be loaded. Please refresh to retry.");});
    api.get(`/products/${id}/questions`).then(({data})=>{if(live)setQuestions(data.items || []);}).catch(()=>{if(live)setQuestionError("Questions could not be loaded. Please refresh to retry.");});
    api.get(`/products/${id}/related`).then(({data})=>{if(live){setVariants(data.variants || []);setBundles(data.bundles || []);}}).catch(()=>{});
    return ()=>{live=false;};
  }, [id]);
  useEffect(()=>{
    let live=true;setCoupons([]);
    api.get(`/products/${id}/offers`).then(({data})=>{if(live)setCoupons(Array.isArray(data)?data:[]);}).catch(()=>{});
    return ()=>{live=false;};
  },[id]);
  useEffect(()=>setNegotiating(isAuthenticated && searchParams.get("negotiate")==="1"),[id,isAuthenticated,searchParams]);
  useEffect(()=>{
    if(!zoom)return;
    const old=document.body.style.overflow;document.body.style.overflow="hidden";zoomClose.current?.focus();
    const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setZoom(false);};window.addEventListener("keydown",close);
    return()=>{document.body.style.overflow=old;window.removeEventListener("keydown",close);gallery.current?.focus();};
  },[zoom]);

  const requireLogin=()=>{if(isAuthenticated)return true;toast.error("Please sign in to continue");router.push("/auth/login");return false;};
  const purchase=async(checkout=false)=>{
    if(!product || busy || !requireLogin())return;
    setBusy(true);try{await addItem(product.id,quantity);if(checkout)router.push("/customer/orders/checkout");else toast.success("Added to cart");}catch{}finally{setBusy(false);}
  };
  const share=async()=>{try{if(navigator.share)await navigator.share({title:product?.name,url:window.location.href});else{await navigator.clipboard.writeText(window.location.href);toast.success("Product link copied");}}catch(e){if((e as Error).name!=="AbortError")toast.error("Could not share. Copy this page’s address to share it.");}};
  const submitReview=async(e:React.FormEvent)=>{e.preventDefault();if(!requireLogin())return;setSubmitting("review");try{await productApi.addReview(id,{rating,comment:comment.trim()});const {data}=await productApi.getReviews(id);setReviews(data.items||[]);const p=await productApi.get(id);setProduct(p.data);setComment("");toast.success("Review published");}catch(e){toast.error(getApiError(e));}finally{setSubmitting("");}};
  const submitQuestion=async(e:React.FormEvent)=>{e.preventDefault();if(!requireLogin())return;setSubmitting("question");try{const {data}=await api.post(`/products/${id}/questions`,{question:question.trim()});setQuestions(q=>[data,...q]);setQuestion("");toast.success("Question sent to the store");}catch(e){toast.error(getApiError(e));}finally{setSubmitting("");}};
  const answerQuestion=async(qid:string)=>{setSubmitting(qid);try{await api.patch(`/products/${id}/questions/${qid}`,{answer:answers[qid]});setQuestions(q=>q.map(x=>x.id===qid?{...x,answer:answers[qid]}:x));toast.success("Answer published");}catch(e){toast.error(getApiError(e));}finally{setSubmitting("");}};

  if(loading)return <div role="status" className="flex min-h-[60vh] items-center justify-center gap-3 text-slate-600"><Loader2 className="animate-spin" size={22}/>Loading product…</div>;
  if(!product)return <div className="mx-auto max-w-xl px-5 py-20 text-center"><h1 className="text-2xl">Product unavailable</h1><p className="my-4 text-sm text-slate-500">{error || "This product is no longer available."}</p><Link href="/customer/products" className="text-sm underline">Browse furniture</Link></div>;
  const images=product.images?.length?product.images:[getProductImage([])];
  const imageIndex=Math.min(selectedImage,images.length-1);
  const available=product.stock_quantity>0 || !!product.allow_pre_order;
  const maxQuantity=product.allow_pre_order?100:Math.min(100,Math.max(1,product.stock_quantity));
  const madeToOrder=product.fulfillment_type==="MADE_TO_ORDER" || product.fulfillment_type==="CUSTOM_ORDER";
  const compare=product.compare_price || 0;
  const discount=compare>product.price?Math.round((compare-product.price)/compare*100):0;
  const specs: [string,string][] = [
    ["Brand / store",product.brand || "Ballanki A1 Furnitures"],
    ["Category",product.category?.name || product.main_category || ""], ["Type",product.subcategory || ""], ["Model / SKU",product.sku || ""],
    ["Material",product.material || ""], ["Wood",product.wood_type || ""], ["Fabric",product.fabric || ""],
    ["Dimensions",typeof product.dimensions==="string"?product.dimensions:product.dimensions?[product.dimensions.length,product.dimensions.width,product.dimensions.height].map((v,i)=>v!=null?`${v}${["L","W","H"][i]}`:"").filter(Boolean).join(" × ")+` ${product.dimensions.unit||""}`:""],
    ["Weight",product.weight_grams?`${product.weight_grams/1000} kg`:""], ["Availability",madeToOrder?"Made to order":available?"Ready stock":"Out of stock"],
    ...Object.entries(product.attributes || {}),
  ].filter((entry):entry is [string,string]=>Boolean(entry[1]));
  const eligibleCoupons=coupons.filter(c=>(!c.valid_from||new Date(c.valid_from)<=new Date())&&(!c.valid_until||new Date(c.valid_until)>=new Date())&&(!c.max_uses||(c.used_count||0)<c.max_uses));
  const chosen=bundles.filter(p=>selectedBundle.includes(String(p.id)));
  const bundleTotal=product.price+chosen.reduce((total,p)=>total+p.price,0);
  const moveImage=(direction:number)=>setSelectedImage((imageIndex+direction+images.length)%images.length);
  const actions=<><button type="button" disabled={!available||busy} onClick={()=>purchase()} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-[#315b49] bg-white px-3 text-xs font-semibold text-[#203f34] disabled:opacity-50"><ShoppingBag size={17}/>{busy?"Please wait…":"Add to cart"}</button><button type="button" disabled={!available||busy} onClick={()=>purchase(true)} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#203f34] px-3 text-xs font-semibold text-white disabled:opacity-50">{busy?<Loader2 size={17} className="animate-spin"/>:null}{available?(product.allow_pre_order && !product.stock_quantity?"Pre-order now":"Buy now"):"Out of stock"}</button></>;
  return <main className="bg-[#f5f6f4] pb-32 font-inter text-slate-800 lg:pb-10">
    <div className="mx-auto max-w-[1440px] px-3 py-3 text-[11px] text-slate-500 sm:px-6"><Link href="/">Home</Link><span className="mx-2">›</span><Link href="/customer/products">Furniture</Link><span className="mx-2">›</span><span>{product.name}</span></div>
    <div className="mx-auto grid max-w-[1440px] items-start gap-4 px-3 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-6">
      <aside className="min-w-0 lg:sticky lg:top-28">
        <div className={panel+" !p-3 sm:!p-4"}>
          <div className="relative">
            <button ref={gallery} aria-label="Enlarge product image" onClick={()=>setZoom(true)} onTouchStart={e=>{touchStart.current=e.touches[0].clientX;}} onTouchEnd={e=>{if(touchStart.current!==null){const dx=e.changedTouches[0].clientX-touchStart.current;if(Math.abs(dx)>40){moveImage(dx<0?1:-1);e.preventDefault();}touchStart.current=null;}}} className="block aspect-square w-full overflow-hidden rounded-lg bg-white"><img src={images[imageIndex]} alt={`${product.name}, image ${imageIndex+1}`} className="h-full w-full object-contain p-3"/><span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500"><ZoomIn size={12}/>Tap to enlarge</span></button>
            <div className="absolute right-2 top-2 flex flex-col gap-2"><button aria-label={isWishlisted(product.id)?"Remove from wishlist":"Save to wishlist"} onClick={()=>{if(requireLogin())void toggleWishlist(product.id);}} className="rounded-full border bg-white p-2.5 shadow-sm"><Heart size={18} className={isWishlisted(product.id)?"fill-rose-500 text-rose-500":"text-slate-600"}/></button><button aria-label="Share product" onClick={share} className="rounded-full border bg-white p-2.5 shadow-sm"><Share2 size={18}/></button></div>
            {images.length>1&&<><button aria-label="Previous image" onClick={()=>moveImage(-1)} className="absolute left-1 top-1/2 rounded-full border bg-white p-1.5 shadow"><ChevronLeft size={18}/></button><button aria-label="Next image" onClick={()=>moveImage(1)} className="absolute right-1 top-1/2 rounded-full border bg-white p-1.5 shadow"><ChevronRight size={18}/></button></>}
          </div>
          {images.length>1&&<div className="mt-3 flex gap-2 overflow-x-auto pb-1">{images.map((src,i)=><button key={i} aria-label={`View image ${i+1}`} aria-pressed={imageIndex===i} onClick={()=>setSelectedImage(i)} className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 sm:h-16 sm:w-16 ${imageIndex===i?"border-[#315b49]":"border-slate-100"}`}><img src={src} alt="" className="h-full w-full object-contain"/></button>)}</div>}
          <div className="mt-4 hidden gap-3 lg:flex">{actions}</div>
        </div>
      </aside>
      <div className="min-w-0 space-y-4">
        <section className={panel}>
          <p className="mb-2 text-xs font-semibold text-[#637754]">BALLANKI A1 FURNITURES</p>
          <h1 className="font-inter text-xl font-medium leading-snug text-slate-900 sm:text-2xl">{product.name}</h1>
          <a href="#product-reviews" className="mt-3 inline-flex items-center gap-2 text-xs"><span className="flex items-center gap-1 rounded bg-[#315b49] px-2 py-1 text-white">{product.rating_count>0?product.rating_avg.toFixed(1):"New"}<Star size={11} className="fill-current"/></span><span className="text-slate-500">{product.rating_count || 0} ratings · {reviews.length} reviews</span></a>
          <div className="mt-4 flex flex-wrap items-baseline gap-3"><strong className="text-3xl tracking-tight">{formatPrice(product.price)}</strong>{discount>0&&<><span className="text-sm text-slate-400 line-through">{formatPrice(compare)}</span><span className="text-sm font-semibold text-green-700">{discount}% off</span></>}</div>
          <p className="mt-2 text-xs text-slate-500">Final charges and any eligible savings are shown at checkout.</p>
          <p className={`mt-4 text-xs font-semibold ${available?"text-green-700":"text-red-600"}`}>{product.stock_quantity>0?`${product.stock_quantity} in stock`:"Made to order · Pre-book available"}{available&&product.allow_pre_order&&!product.stock_quantity?" · Pre-order available":""}</p>
          {product.short_description&&<p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{product.short_description}</p>}
          {variants.length>0&&<div className="mt-5 border-t pt-4"><h2 className="mb-3 font-inter text-sm font-semibold">Available options</h2><div className="flex gap-2 overflow-x-auto pb-2">{[product,...variants].map(v=><Link key={v.id} href={`/customer/products/${v.id}`} aria-current={v.id===product.id?"page":undefined} className={`w-28 shrink-0 rounded-lg border p-2 text-xs ${v.id===product.id?"border-[#315b49] bg-[#eff3ea]":"border-slate-200"}`}><img src={getProductImage(v.images)} alt="" className="mb-2 h-16 w-full object-contain"/><span className="line-clamp-2">{v.name}</span><span className="mt-1 block font-semibold">{formatPrice(v.price)}</span></Link>)}</div></div>}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"><label className="flex items-center gap-3 text-xs">Quantity<span className="flex items-center rounded border"><button aria-label="Decrease quantity" disabled={quantity<=1} onClick={()=>setQuantity(q=>q-1)} className="p-2 disabled:opacity-30"><Minus size={13}/></button><span className="min-w-7 text-center">{quantity}</span><button aria-label="Increase quantity" disabled={!available||quantity>=maxQuantity} onClick={()=>setQuantity(q=>q+1)} className="p-2 disabled:opacity-30"><Plus size={13}/></button></span></label><button onClick={()=>{if(requireLogin())setNegotiating(true);}} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#b5c4a9] bg-[#eff3ea] px-4 text-xs font-semibold text-[#315b49]"><MessageSquare size={16}/>Negotiate price</button></div>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5">{quantity>product.stock_quantity?`${Math.max(0,quantity-product.stock_quantity)} unit(s) will be made to order. A fixed 20% advance applies to these units at the listed or accepted negotiated price. Remaining balance is recorded at checkout.`:"Buy available stock at the listed price or negotiate with the admin. Once stock runs out, pre-book with a fixed 20% advance."}</p>
        </section>
        {eligibleCoupons.length>0&&<section className={panel}><h2 className="mb-3 font-inter text-base font-semibold">Available offers</h2><div className="space-y-3">{eligibleCoupons.map(c=><div key={c.id} className="flex gap-3 text-xs"><Tag size={16} className="shrink-0 text-green-700"/><div><strong>{c.code}</strong> · {c.description || (c.discount_type==="percentage"?`${c.discount_value}% discount`:`Save ${formatPrice(c.discount_value ?? c.discount_amount ?? 0)}`)}<p className="mt-1 text-slate-500">Minimum order {formatPrice(c.min_order_amount || 0)}. Eligibility checked at checkout.</p><button onClick={()=>{navigator.clipboard.writeText(c.code).then(()=>toast.success("Coupon copied")).catch(()=>toast.error("Could not copy coupon"));}} className="mt-1 font-semibold text-[#315b49]">Copy code</button></div></div>)}</div></section>}
        <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-inter text-base font-semibold"><Truck size={18}/>Delivery details</h2><div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-xs"><span>{location?`${location.city} · ${location.pincode}`:"Select your delivery location"}</span><button onClick={openModal} className="shrink-0 font-semibold text-[#315b49]">{location?"Change":"Check pincode"}</button></div><p className="mt-3 text-xs leading-6 text-slate-600">{product.expected_delivery_date?`Admin expected delivery: ${new Date(product.expected_delivery_date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"})}. `:"Expected delivery date will be confirmed by the admin. "}{madeToOrder&&product.manufacturing_duration_days?`Production estimate: ${product.manufacturing_duration_days} days. `:""}{product.shipping_duration_days?`Shipping estimate: ${product.shipping_duration_days} days after dispatch. `:""}Delivery availability and charges are confirmed at checkout.</p><p className="mt-3 text-xs"><span className="text-slate-500">Sold and managed by </span><strong>Ballanki A1 Furnitures</strong></p></section>
        <section className={panel}><h2 className="mb-3 font-inter text-base font-semibold">Shop with peace of mind</h2>{product.warranty_text&&<p className="mb-3 flex gap-2 whitespace-pre-line text-xs leading-6"><ShieldCheck size={17} className="shrink-0"/>{product.warranty_text}</p>}<div className="flex flex-wrap gap-3 text-xs"><Link href="/returns" className="rounded-lg border px-3 py-2">Return & refund policy ↗</Link><Link href="/shipping" className="rounded-lg border px-3 py-2">Delivery policy ↗</Link><Link href="/customer/support" className="rounded-lg border px-3 py-2">Ask the store ↗</Link></div></section>
        <section className={panel}><h2 className="mb-4 font-inter text-base font-semibold">Product highlights</h2><ul className="grid gap-3 text-sm sm:grid-cols-2">{specs.filter(([k])=>["Material","Wood","Fabric","Dimensions","Availability"].includes(k)).map(([k,v])=><li key={k} className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7f936b]"/><span><span className="text-xs text-slate-500">{k}</span><span className="block text-sm">{v}</span></span></li>)}</ul></section>
        <details open className={panel}><summary className="cursor-pointer font-semibold">All details & specifications</summary>{product.description&&<p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p>}<dl className="mt-4 divide-y text-xs">{specs.map(([k,v])=><div key={k} className="grid grid-cols-[35%_1fr] gap-4 py-3"><dt className="text-slate-500">{k}</dt><dd>{v}</dd></div>)}</dl></details>
        <section id="product-reviews" className={panel+" scroll-mt-28"}><h2 className="font-inter text-lg font-semibold">Ratings & reviews</h2><div className="my-5 grid grid-cols-[100px_1fr] gap-5"><div><p className="text-3xl font-semibold">{product.rating_count>0?product.rating_avg.toFixed(1):"—"}<Star size={18} className="ml-1 inline text-[#315b49]"/></p><p className="mt-1 text-[11px] text-slate-500">{product.rating_count||0} ratings</p></div><div className="space-y-1">{[5,4,3,2,1].map(n=>{const count=reviews.filter(r=>r.rating===n).length;return <div key={n} className="flex items-center gap-2 text-[10px]"><span>{n} ★</span><span className="h-1.5 flex-1 overflow-hidden rounded bg-slate-100"><span className="block h-full bg-[#6f8b58]" style={{width:`${reviews.length?count/reviews.length*100:0}%`}}/></span><span className="w-5 text-right">{count}</span></div>;})}</div></div>{reviewError?<p className="text-xs text-red-600">{reviewError}</p>:!reviews.length?<p className="text-sm text-slate-500">No customer reviews yet.</p>:<div className="divide-y">{(allReviews?reviews:reviews.slice(0,3)).map(r=><article key={r.id} className="py-4"><div className="flex justify-between gap-3 text-xs"><span className="rounded bg-[#315b49] px-2 py-1 text-white">{r.rating} ★</span><span className="text-slate-400">{r.created_at?formatDate(r.created_at):""}</span></div>{r.comment&&<p className="mt-3 whitespace-pre-line text-sm leading-6">{r.comment}</p>}{!!r.images?.length&&<div className="mt-3 flex gap-2 overflow-x-auto">{r.images.map((src,i)=><a href={src} target="_blank" rel="noreferrer" key={i}><img src={src} alt={`Customer photo ${i+1}`} loading="lazy" className="h-16 w-16 rounded object-cover"/></a>)}</div>}<p className="mt-3 text-[11px] text-slate-500">{r.user_name} · Verified purchase</p></article>)}</div>}{reviews.length>3&&<button onClick={()=>setAllReviews(v=>!v)} className="mt-3 w-full rounded-lg border py-2 text-xs">{allReviews?"Show fewer reviews":"Show all reviews"}</button>}<details className="mt-5 border-t pt-4"><summary className="cursor-pointer text-sm font-semibold">Write a review</summary><p className="my-3 text-xs text-slate-500">Reviews are available after your order has been delivered. One review per product.</p><form onSubmit={submitReview} className="space-y-3"><label className="block text-xs">Your rating<select value={rating} onChange={e=>setRating(Number(e.target.value))} className="ml-3 rounded border p-2">{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></label><textarea aria-label="Your review" maxLength={3000} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Share your experience with this furniture" className="w-full rounded-lg border p-3 text-sm" rows={3}/><button disabled={!!submitting} className="rounded-lg bg-[#203f34] px-4 py-2 text-xs text-white disabled:opacity-50">{submitting==="review"?"Publishing…":"Publish review"}</button></form></details></section>
        <section className={panel}><h2 className="font-inter text-lg font-semibold">Questions & answers</h2><p className="mt-2 text-xs text-slate-500">Ask about materials, dimensions, assembly or care. Please don’t include personal contact information.</p>{questionError?<p className="mt-4 text-xs text-red-600">{questionError}</p>:<div className="divide-y">{!questions.length&&<p className="py-4 text-sm text-slate-500">No questions yet. Ask the store a question below.</p>}{questions.map(q=><article key={q.id} className="py-4 text-sm"><p className="font-semibold">Q: {q.question}</p>{q.answer?<p className="mt-2 leading-6">A: {q.answer}<span className="mt-1 block text-[10px] text-[#637754]">Ballanki store team</span></p>:<p className="mt-2 text-xs text-slate-400">Awaiting the store’s reply</p>}{user?.role==="admin"&&<div className="mt-3 flex gap-2"><input aria-label="Store answer" value={answers[q.id]??q.answer} maxLength={2000} onChange={e=>setAnswers(a=>({...a,[q.id]:e.target.value}))} className="min-w-0 flex-1 rounded border p-2 text-xs"/><button disabled={!!submitting||!answers[q.id]?.trim()} onClick={()=>answerQuestion(q.id)} className="rounded bg-[#203f34] px-3 text-xs text-white disabled:opacity-50">Reply</button></div>}</article>)}</div>}<form onSubmit={submitQuestion} className="mt-4 flex flex-col gap-2 sm:flex-row"><input aria-label="Ask a question" required minLength={5} maxLength={1000} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="What would you like to know?" className="min-w-0 flex-1 rounded-lg border p-3 text-sm"/><button disabled={!!submitting} className="rounded-lg bg-[#203f34] px-4 py-3 text-xs text-white disabled:opacity-50">{submitting==="question"?"Sending…":"Ask question"}</button></form></section>
      </div>
    </div>
    <div className="mx-auto max-w-[1440px] space-y-5 px-3 pt-6 sm:px-6">
      {bundles.length>0&&<section className={panel}><h2 className="font-inter text-lg font-semibold">Complete the room</h2><p className="mb-4 mt-2 text-xs text-slate-500">Pair this piece with products selected by the store. Items are priced individually.</p><div className="flex gap-4 overflow-x-auto pb-3">{[product,...bundles].map((p,i)=><label key={p.id} className="w-40 shrink-0 rounded-lg border p-3 text-xs"><input type="checkbox" checked={i===0||selectedBundle.includes(String(p.id))} disabled={i===0||(!p.allow_pre_order&&p.stock_quantity<1)} onChange={e=>setSelectedBundle(v=>e.target.checked?[...v,String(p.id)]:v.filter(x=>x!==String(p.id)))} className="mb-2"/><img src={getProductImage(p.images)} alt="" className="h-24 w-full object-contain"/><span className="my-2 block line-clamp-2">{p.name}</span><strong>{formatPrice(p.price)}</strong></label>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><strong>{formatPrice(bundleTotal)} <span className="text-xs font-normal text-slate-500">for {chosen.length+1} item(s)</span></strong><button disabled={busy||!available||!chosen.length} onClick={async()=>{if(!requireLogin())return;setBusy(true);let added=0;try{for(const p of [product,...chosen]){await addItem(p.id,1);added++;}toast.success("Selected items added to cart");setSelectedBundle([]);}catch{toast.error(`${added} item(s) added. Review your cart before retrying.`);}finally{setBusy(false);}}} className="rounded-lg bg-[#203f34] px-5 py-3 text-xs text-white disabled:opacity-50">Add selected items</button></div></section>}
      {similar.length>0&&<section className={panel}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="font-inter text-lg font-semibold">You might also like</h2><Link href="/customer/products" className="flex items-center gap-1 text-xs">View all<ArrowRight size={14}/></Link></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{similar.slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
      {similarPrice.filter(p=>!similar.some(s=>String(s.id)===String(p.id))).length>0&&<section className={panel}><h2 className="mb-5 font-inter text-lg font-semibold">Similar furniture in this price range</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{similarPrice.filter(p=>!similar.some(s=>String(s.id)===String(p.id))).slice(0,4).map(p=><ProductCard key={p.id} product={p}/>)}</div></section>}
    </div>
    <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t bg-white p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-lg lg:hidden">{actions}</div>
    {negotiating&&<BargainPanel productId={product.id} productName={product.name} productImage={images[imageIndex]} listedPrice={product.price} onClose={()=>{setNegotiating(false);if(searchParams.get("negotiate")){const q=new URLSearchParams(searchParams.toString());q.delete("negotiate");router.replace(`/customer/products/${id}${q.size?`?${q}`:""}`,{scroll:false});}}}/> }
    {zoom&&<div role="dialog" aria-modal="true" aria-label="Product image viewer" onKeyDown={e=>{if(e.key==="ArrowLeft")moveImage(-1);if(e.key==="ArrowRight")moveImage(1);if(e.key==="Tab"){const buttons=Array.from(e.currentTarget.querySelectorAll('button'));const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}} className="fixed inset-0 z-[120] flex items-center justify-center bg-white p-5"><button ref={zoomClose} aria-label="Close image viewer" onClick={()=>setZoom(false)} className="absolute right-5 top-5 rounded-full border p-3"><X size={20}/></button><img src={images[imageIndex]} alt={product.name} className="max-h-[85dvh] max-w-full object-contain"/>{images.length>1&&<><button aria-label="Previous enlarged image" onClick={()=>moveImage(-1)} className="absolute left-3 top-1/2 rounded-full border bg-white p-2"><ChevronLeft/></button><button aria-label="Next enlarged image" onClick={()=>moveImage(1)} className="absolute right-3 top-1/2 rounded-full border bg-white p-2"><ChevronRight/></button></>}<p className="absolute bottom-4 text-xs text-slate-500">{imageIndex+1} / {images.length}</p></div>}
  </main>;
}
