"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Armchair, BedDouble, ChevronLeft, ChevronRight, Home, LampDesk, LayoutGrid, Sofa, Table2, Tv, Warehouse, MessageCircle, PackageCheck, CalendarDays } from "lucide-react";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
type Category = { name: string; slug: string };
const furnitureCategories: Category[] = [
  { name: "Chairs", slug: "chair" }, { name: "Dining", slug: "dining" },
  { name: "Sofas", slug: "sofa" }, { name: "Beds", slug: "bed" },
  { name: "Cupboards", slug: "cupboard" }, { name: "Tables", slug: "table" },
  { name: "Wardrobes", slug: "wardrobe" }, { name: "TV Units", slug: "tv" },
  { name: "Storage", slug: "storage" }, { name: "Office Furniture", slug: "office" },
  { name: "Recliners", slug: "recliner" }, { name: "Shoe Racks", slug: "shoe" },
  { name: "Bookshelves", slug: "bookshelf" }, { name: "Study Desks", slug: "desk" },
  { name: "Dressing Tables", slug: "dressing" }, { name: "Mattresses", slug: "mattress" },
  { name: "Outdoor Furniture", slug: "outdoor" }, { name: "Kids Furniture", slug: "kids" },
];
function categoryIcon(name: string) {
  const value = name.toLowerCase();
  if (/sofa|couch|living|lounge/.test(value)) return Sofa;
  if (/bed|mattress/.test(value)) return BedDouble;
  if (/chair|seat/.test(value)) return Armchair;
  if (/table|desk|dining/.test(value)) return Table2;
  if (/storage|wardrobe|cabinet|cupboard/.test(value)) return Warehouse;
  if (/tv|entertainment/.test(value)) return Tv;
  if (/lamp|decor/.test(value)) return LampDesk;
  return Home;
}


export default function HomeDiscovery(_props: { products: Product[]; loading: boolean }) {
  const [categories, setCategories] = useState<Category[]>(furnitureCategories);
  const [reducedMotion, setReducedMotion] = useState(false);
  const categoryRail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    productApi.categories().then(({data})=>{
      if(!cancelled && Array.isArray(data))setCategories([...furnitureCategories,...data.filter((item:Category)=>typeof item.name==="string"&&item.name.trim()&&!furnitureCategories.some(base=>base.name.toLowerCase()===item.name.trim().toLowerCase()))]);
    }).catch(()=>{});
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReducedMotion(media.matches);update();media.addEventListener("change",update);
    return()=>{cancelled=true;media.removeEventListener("change",update);};
  },[]);
  return <div className="bg-[#faf8f3] text-[#203b31]">
      <nav id="shop-by-category" aria-label="Shop furniture categories" className="scroll-mt-28 border-y border-[#e7e6dc] bg-white py-4">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 pt-2">
            <div><h2 className="font-playfair text-xl text-[#203b31] sm:text-2xl">What are you looking for?</h2><p className="mt-1 text-[10px] text-slate-500">Swipe to explore all furniture types</p></div>
            <div className="hidden gap-2 sm:flex">
              <button type="button" aria-label="Previous categories" onClick={() => categoryRail.current?.scrollBy({ left: -categoryRail.current.clientWidth * 0.7, behavior: reducedMotion ? "instant" : "smooth" })} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-sky-50"><ChevronLeft size={18} /></button>
              <button type="button" aria-label="More categories" onClick={() => categoryRail.current?.scrollBy({ left: categoryRail.current.clientWidth * 0.7, behavior: reducedMotion ? "instant" : "smooth" })} className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 hover:bg-sky-50"><ChevronRight size={18} /></button>
            </div>
          </div>
          <div ref={categoryRail} tabIndex={0} aria-label="All furniture categories, scroll horizontally to explore" className="flex min-w-0 snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain scrollbar-none sm:gap-5 lg:gap-7">
            <Link href="/" aria-current="page" className="relative flex w-16 sm:w-24 shrink-0 snap-start flex-col items-center gap-1.5 pb-2 pt-2 text-center text-[10px] sm:gap-2 sm:pb-4 sm:pt-3 font-bold sm:w-24 sm:text-sm">
              <span className="flex h-9 w-10 sm:h-12 sm:w-14 items-center justify-center rounded-2xl bg-[#e8eee3]"><LayoutGrid size={29} strokeWidth={1.65} className="h-6 w-6 sm:h-[29px] sm:w-[29px] text-slate-900" /></span>
              <span>For You</span><span className="absolute inset-x-2 bottom-0 h-1 rounded-full bg-[#315b49]" />
            </Link>
            {categories.map(category => {
              const Icon = categoryIcon(category.name);
              return <Link key={category.name} href={`/customer/products?category=${encodeURIComponent(furnitureCategories.includes(category) ? category.slug : category.name)}`} className="group relative flex w-16 sm:w-24 shrink-0 snap-start flex-col items-center gap-1.5 pb-2 pt-2 text-center text-[10px] sm:gap-2 sm:pb-4 sm:pt-3 font-medium sm:w-24 sm:text-sm">
                <span className="flex h-9 w-10 sm:h-12 sm:w-14 items-center justify-center rounded-2xl transition-colors bg-[#f5f3ed] group-hover:bg-[#e8eee3]"><Icon size={31} strokeWidth={1.6} className="h-6 w-6 sm:h-[31px] sm:w-[31px] text-slate-800" /></span>
                <span className="line-clamp-2 min-h-7 leading-3.5 sm:min-h-8 sm:leading-5">{category.name}</span>
                <span className="absolute inset-x-2 bottom-0 h-1 scale-x-0 rounded-full bg-[#315b49] transition-transform group-hover:scale-x-100" />
              </Link>;
            })}
          </div>
        </div>
      </nav>
    <section aria-label="Welcome to Ballanki" className="mx-auto max-w-[1440px] px-4 pb-7 pt-5 sm:px-6 sm:pb-10 lg:px-8 lg:pt-8">
      <div className="grid overflow-hidden rounded-[24px] border border-[#e6e5dc] bg-[#f1eee5] lg:min-h-[520px] lg:grid-cols-[0.92fr_1.08fr] lg:rounded-[32px]">
        <div className="flex flex-col items-start px-6 pb-7 pt-7 sm:px-10 sm:py-10 lg:justify-center lg:px-12 xl:px-16">
          <p className="mb-4 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#63745b] sm:text-[10px]"><span className="h-px w-6 bg-[#a38453]"/>A home, thoughtfully furnished</p>
          <h1 className="max-w-xl font-playfair text-[36px] leading-[1.12] tracking-[-0.035em] min-[375px]:text-[42px] sm:text-[52px] lg:text-[56px] xl:text-[66px]">Make room for<br/><span className="italic text-[#57714f]">beautiful living.</span></h1>
          <p className="mt-4 max-w-[360px] text-[13px] leading-6 text-[#5c675c] sm:mt-5 sm:text-sm sm:leading-7">Find furniture that feels like you. Shop available pieces, or pre-book something worth waiting for.</p>
          <div className="mt-6 flex w-full flex-wrap items-center gap-3 sm:mt-7 sm:gap-5">
            <Link href="/customer/products" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#203f34] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#315b49] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#315b49]">Shop furniture<ArrowRight size={16}/></Link>
            <a href="#shop-by-category" className="inline-flex min-h-12 items-center gap-2 text-xs font-semibold text-[#203f34] underline decoration-[#a7af98] underline-offset-4">Explore categories<ArrowRight size={14}/></a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#d9ddcf] pt-4 text-[10px] text-[#65705f] sm:mt-8 sm:text-[11px]"><span className="flex items-center gap-1.5"><MessageCircle size={14}/>Talk price with the owner</span><span className="flex items-center gap-1.5"><CalendarDays size={14}/>20% advance on pre-bookings</span></div>
        </div>
        <div className="relative min-w-0 bg-[#d9dfd0]">
          <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=85&w=1400" alt="Living room inspiration with a deep green sofa, warm wood and natural textures" fetchPriority="high" className="aspect-[1.5] h-full w-full object-cover object-[center_58%] sm:aspect-[1.9] lg:absolute lg:inset-0 lg:aspect-auto"/>
          <div className="absolute inset-0 bg-gradient-to-t from-[#17372a]/45 via-transparent to-transparent"/>
          <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white sm:inset-x-7 sm:bottom-7"><div><p className="mb-1 text-[8px] uppercase tracking-[0.2em] text-white/80 sm:text-[9px]">Room inspiration</p><p className="font-playfair text-xl sm:text-2xl">Your everyday sanctuary.</p></div><Link href="/customer/products?category=sofa" aria-label="Explore sofas" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/15 backdrop-blur-sm transition-colors hover:bg-white/30"><ArrowRight size={19}/></Link></div>
        </div>
      </div>
    </section>

    <section aria-label="How to shop" className="mx-auto grid max-w-[1440px] gap-5 px-5 py-7 sm:grid-cols-3 sm:gap-8 sm:px-8 lg:px-12 lg:py-9">
      {[{icon:Armchair,title:"Find your piece",text:"Explore furniture by type, room and style."},{icon:MessageCircle,title:"Buy or negotiate",text:"Choose the listed price or discuss an offer with the owner."},{icon:PackageCheck,title:"Ready now. Or made for you.",text:"Buy available stock or pre-book with a 20% advance."}].map(({icon:Icon,title,text})=><div key={title} className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9ede2] text-[#486345]"><Icon size={18} strokeWidth={1.6}/></span><div><h2 className="font-inter text-xs font-semibold">{title}</h2><p className="mt-1 max-w-xs text-[11px] leading-5 text-[#70786b]">{text}</p></div></div>)}
    </section>
  </div>;
}
