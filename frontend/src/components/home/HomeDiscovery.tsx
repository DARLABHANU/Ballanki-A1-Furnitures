"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Armchair, BedDouble, ChevronLeft, ChevronRight, Home, LampDesk, LayoutGrid, Pause, Play, Sofa, Table2, Tv, Warehouse } from "lucide-react";
import { productApi } from "@/lib/api";
import { Product } from "@/types";
import { getProductImage } from "@/lib/utils";

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
const inspiration = [
  { title: "A fresh look for your living space", label: "Furniture inspiration", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=1000" },
  { title: "Make room for everyday comfort", label: "Explore the collection", image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=1000" },
  { title: "Find furniture that feels like home", label: "Discover Ballanki", image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=1000" },
];
const colors = ["from-[#183f35] to-[#376251]", "from-[#75503a] to-[#a57b5b]", "from-[#414a38] to-[#778367]"];
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

export default function HomeDiscovery({ products, loading }: { products: Product[]; loading: boolean }) {
  const [categories, setCategories] = useState<Category[]>(furnitureCategories);
  const [active, setActive] = useState(0);
  const [positionCount, setPositionCount] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const categoryRail = useRef<HTMLDivElement>(null);
  const productCards = products.map(product => ({
    title: product.name,
    label: (product as Product & { main_category?: string }).main_category || "Explore our furniture",
    image: getProductImage(product.images),
    href: `/customer/products/${product.id}`,
    price: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price),
    alt: product.name,
  }));
  const cards = [...productCards, ...inspiration.slice(0, Math.max(0, 3 - productCards.length)).map(slide => ({ ...slide, href: "/customer/products", price: "", alt: slide.label }))];

  useEffect(() => {
    let cancelled = false;
    productApi.categories().then(({ data }) => {
      if (!cancelled && Array.isArray(data)) {
        const extras = data.filter((item: Category) => typeof item.name === "string" && item.name.trim()
          && !furnitureCategories.some(base => base.name.toLowerCase() === item.name.trim().toLowerCase()));
        setCategories([...furnitureCategories, ...extras]);
      }
    }).catch(() => {});
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => { cancelled = true; media.removeEventListener("change", update); };
  }, []);

  const scrollStops = () => {
    const element = rail.current;
    if (!element?.children.length) return [0];
    const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
    const origin = (element.children[0] as HTMLElement).offsetLeft;
    const stops = Array.from(element.children).map(child => Math.min(maximum, (child as HTMLElement).offsetLeft - origin));
    return stops.filter((stop, index) => index === 0 || Math.abs(stop - stops[index - 1]) > 2);
  };
  const goTo = (index: number, smooth = true) => {
    const element = rail.current;
    if (!element) return;
    const stops = scrollStops();
    const normalized = (index + stops.length) % stops.length;
    element.scrollTo({ left: stops[normalized], behavior: smooth && !reducedMotion ? "smooth" : "instant" });
    setActive(normalized);
  };

  useEffect(() => {
    if (paused || hovered || reducedMotion || loading || positionCount < 2) return;
    const interval = window.setInterval(() => {
      if (!document.hidden) goTo(active + 1);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [active, paused, hovered, reducedMotion, loading, positionCount]);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const resize = () => { const count = scrollStops().length; setPositionCount(count); setActive(value => Math.min(value, count - 1)); };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [cards.length]);

  return (
    <div className="bg-[#faf8f3] text-[#203b31]">
      <section aria-label="Welcome to Ballanki" className="mx-auto max-w-[1440px] px-3 pb-5 pt-3 sm:px-6 lg:px-8 lg:pb-9 lg:pt-6">
        <div className="relative isolate overflow-hidden rounded-[24px] bg-[#e7e4da] lg:rounded-[32px]">
          <div className="absolute inset-0">
            <img src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=85&w=1600" alt="Room inspiration with a deep green sofa" fetchPriority="high" className="absolute bottom-0 h-[44%] w-full object-cover object-[center_64%] lg:inset-0 lg:h-full lg:object-[right_60%]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f4f0e7] from-50% via-transparent via-70% to-transparent lg:from-0% lg:via-50% lg:bg-gradient-to-r lg:from-[#eee9dd] lg:via-[#eee9dd]/90 lg:to-transparent" />
          </div>
          <div className="relative flex min-h-[430px] flex-col items-start px-5 pb-5 pt-6 sm:min-h-[460px] sm:px-8 sm:pt-8 lg:min-h-[480px] lg:w-[57%] lg:justify-center lg:px-12 lg:py-12 xl:min-h-[510px]">
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#4f6552] lg:mb-5 lg:text-[10px]">Ballanki A1 Furnitures</p>
            <h1 className="text-[32px] leading-[1.08] tracking-tight min-[375px]:text-[38px] sm:text-5xl lg:text-[52px] xl:text-[64px]">Come home<br />to <span className="italic text-[#53694c]">comfort.</span></h1>
            <p className="mt-3 max-w-[240px] text-xs leading-5 text-[#435447] sm:max-w-sm sm:text-sm sm:leading-6 lg:mt-5">Furniture for living, dining and everything in between.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 lg:mt-7 lg:gap-5">
              <Link href="/customer/products" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#203f34] px-5 py-3 text-[11px] font-semibold text-white hover:bg-[#315b49] sm:text-xs">Shop furniture<ArrowRight size={15} /></Link>
              <a href="#shop-by-category" className="inline-flex min-h-11 items-center border-b border-[#829077] text-[11px] font-semibold sm:text-xs">Explore categories</a>
            </div>
            <span className="mt-auto rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-[9px] text-[#485c48] backdrop-blur-sm lg:hidden">Living room inspiration</span>
          </div>
          <Link href="/customer/products?category=sofa" className="absolute bottom-7 right-7 hidden items-center gap-3 rounded-full border border-white/60 bg-white/90 px-5 py-3 text-xs text-[#203b31] shadow-sm backdrop-blur-sm lg:flex">Explore sofas<ArrowRight size={16} /></Link>
        </div>
      </section>
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

      <section aria-label="Furniture highlights" aria-roledescription="carousel" className="mx-auto max-w-[1440px] px-4 pb-5 pt-5 sm:px-6 lg:px-8 lg:pt-6" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setHovered(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setHovered(false); }}>
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-[#77816b]">A closer look</p><h2 className="font-playfair text-2xl sm:text-3xl">Find your next favourite.</h2></div><Link href="/customer/products" className="flex items-center gap-2 text-xs font-medium">View all<ArrowRight size={14} /></Link></div>
        <div className="relative">
          <div ref={rail} data-hero-rail className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-2xl scrollbar-none sm:gap-5 lg:gap-6" onPointerDown={() => setPaused(true)} onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); setPaused(true); goTo(active + (event.key === "ArrowRight" ? 1 : -1)); } }} tabIndex={0} aria-label="Swipe or use arrow keys to browse furniture" onScroll={() => {
            const element = rail.current;
            if (!element || !element.children.length) return;
            const stops = scrollStops();
            setActive(stops.reduce((closest, stop, index) => Math.abs(stop - element.scrollLeft) < Math.abs(stops[closest] - element.scrollLeft) ? index : closest, 0));
          }}>
            {cards.map((card, index) => <Link key={card.href + index} href={card.href} aria-label={`${card.title}${card.price ? ", " + card.price : ""}. Browse furniture`} aria-roledescription="slide" className={`group relative isolate aspect-[1.65] w-full min-w-0 shrink-0 snap-start overflow-hidden rounded-[22px] bg-gradient-to-br ${colors[index % colors.length]} text-white sm:aspect-[1.9] sm:w-[80%] lg:w-[calc((100%_-_24px)/2)] xl:w-[39%]`}>
              <div className="absolute -bottom-24 -left-12 h-60 w-60 rounded-full border-[35px] border-white/5" />
              <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15" />
              <div className="relative z-10 flex h-full w-[56%] flex-col items-start justify-center py-4 pl-4 pr-2 sm:pl-6 lg:pl-5 xl:pl-6">
                <span className="mb-2 max-w-full truncate rounded-full border border-white/25 bg-white/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]">{card.label}</span>
                <h2 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight min-[375px]:text-xl sm:text-2xl lg:text-xl xl:text-2xl 2xl:text-3xl">{card.title}</h2>
                {card.price && <p className="mt-1.5 text-base font-semibold sm:text-xl">{card.price}</p>}
                <span className="mt-3 inline-flex items-center gap-1.5 border-b border-white/60 pb-1 text-[10px] font-semibold sm:text-xs">{card.price ? "View product" : "Shop furniture"}<ArrowRight size={13} /></span>
              </div>
              <div className="absolute bottom-[8%] right-[4%] top-[8%] w-[41%] overflow-hidden rounded-t-[60px] rounded-b-2xl border-[3px] border-white/30 bg-[#f5f1e9] shadow-xl sm:rounded-t-[85px]">
                <img src={card.image} alt={card.alt} loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${card.price ? "object-contain p-2" : "object-cover"}`} />
              </div>
            </Link>)}
          </div>
          {positionCount > 1 && <>
            <button type="button" aria-label="Previous furniture highlight" onClick={() => { setPaused(true); goTo(active - 1); }} className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-md hover:bg-sky-50 lg:flex"><ChevronLeft size={20} /></button>
            <button type="button" aria-label="Next furniture highlight" onClick={() => { setPaused(true); goTo(active + 1); }} className="absolute -right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-md hover:bg-sky-50 lg:flex"><ChevronRight size={20} /></button>
          </>}
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: positionCount }, (_, index) => <button key={index} type="button" aria-label={`Show highlight ${index + 1}`} aria-current={index === active ? "true" : undefined} className="flex h-8 items-center justify-center px-1" onClick={() => { setPaused(true); goTo(index); }}><span className={`h-1.5 rounded-full transition-all ${index === active ? "w-8 bg-slate-950" : "w-4 bg-slate-200"}`} /></button>)}
          <button type="button" aria-label={paused ? "Play highlight slideshow" : "Pause highlight slideshow"} onClick={() => setPaused(value => !value)} className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">{paused ? <Play size={13} /> : <Pause size={13} />}</button>
        </div>
      </section>
    </div>
  );
}
