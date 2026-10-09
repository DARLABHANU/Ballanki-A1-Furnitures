"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import HomeDiscovery from "@/components/home/HomeDiscovery";
import { productApi, api } from "@/lib/api";
import Footer from "@/components/layout/Footer";
import {
  Heart, ShieldCheck, Truck, RefreshCw, Headphones
} from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { getProductImage } from "@/lib/utils";

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const { wishlistIds, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  useEffect(() => {
    setIsLoadingProducts(true);
    productApi.list({ limit: 4 })
      .then((res: any) => {
        setProducts(res.data.items || res.data.data || res.data || []);
      })
      .catch((err: any) => {
        console.error("Failed to load products", err);
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    try { await api.post("/newsletter", { email: newsletterEmail }); toast.success("Subscription saved"); setNewsletterEmail(""); } catch (err: any) { toast.error(err.response?.data?.error || "Subscription could not be saved"); }
  };

  const displayProducts = products.map((p) => {
    const origPrice = (p as any).compare_price || (p as any).original_price;
    const discVal = origPrice && origPrice > p.price ? Math.round(((origPrice - p.price) / origPrice) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      rating: p.rating_avg || null,
      reviews: p.rating_count || null,
      price: p.price,
      originalPrice: origPrice && origPrice > p.price ? origPrice : null,
      discount: discVal > 0 ? `${discVal}% OFF` : null,
      img: getProductImage(p.images),
    };
  });

  return (
    <div className="storefront-home min-h-screen bg-[#faf8f3] text-[#203b31] font-inter flex flex-col">
      <Navbar discovery />

      <main className="flex-1 w-full pb-8">
        <HomeDiscovery products={products} loading={isLoadingProducts} />
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-14">

          {/* ==============================================================================
              FEATURED PRODUCTS
          ============================================================================== */}
          <section className="space-y-10">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2 text-left">
                <span className="font-outfit text-xs font-bold tracking-[0.2em] uppercase text-wood-500">The collection</span>
                <h2 className="font-playfair text-2xl md:text-4xl font-bold text-[#203b31]">Fresh finds for your home</h2>
              </div>
              <Link href="/customer/products" className="font-outfit text-sm font-bold text-[#62755c] hover:text-[#203b31] transition-colors uppercase tracking-widest border-b border-wood-300 pb-1">
                View All
              </Link>
            </div>

            {isLoadingProducts && <p role="status" className="text-sm text-slate-500">Loading the collection…</p>}
            {!isLoadingProducts && !displayProducts.length && <div className="rounded-2xl border border-[#e0e4d9] bg-white p-8 text-center"><p className="text-sm text-slate-600">The collection is unavailable right now. Please try again shortly.</p><Link href="/customer/products" className="mt-3 inline-block text-sm underline">Browse furniture</Link></div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {displayProducts.map((item) => {
                const isWished = wishlistIds.includes(item.id);
                return (
                  <Link
                    href={`/customer/products/${item.id}`}
                    key={item.id}
                    className="group"
                  >
                    <div className="relative aspect-[4/5] bg-white rounded-xl overflow-hidden mb-4 border border-wood-200 group-hover:border-wood-400 transition-colors duration-300">
                      {/* Discount Badge */}
                      {item.discount && (
                        <div className="absolute top-3 left-3 bg-wood-800 text-white font-outfit text-[9px] font-bold px-2.5 py-1 rounded-sm uppercase tracking-widest z-10 shadow-sm">
                          {item.discount}
                        </div>
                      )}

                      {/* Wishlist Button */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!isAuthenticated) { toast.error("Please sign in to save to wishlist"); return; }
                          const added = await toggleWishlist(item.id);
                          toast.success(added ? "Added to wishlist" : "Removed from wishlist");
                        }}
                        aria-label={isWished ? `Remove ${item.name} from wishlist` : `Save ${item.name} to wishlist`}
                        className="absolute top-3 right-3 w-8 h-8 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white border border-wood-200 shadow-sm z-10 transition-transform opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:-translate-y-2 lg:group-hover:translate-y-0 duration-300"
                      >
                        <Heart size={14} className={isWished ? "fill-wood-600 text-[#62755c]" : "text-[#203b31]"} />
                      </button>

                      {/* Add to Cart Overlay Button */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          await addItem(item.id, 1);
                          toast.success("Added to cart");
                        }}
                        className="absolute bottom-4 left-4 right-4 bg-[#203f34] text-white font-outfit text-xs font-bold py-3 rounded-lg opacity-100 translate-y-0 lg:opacity-0 lg:translate-y-4 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300 shadow-xl z-10 hover:bg-[#315b49]"
                      >
                        + Add To Cart
                      </button>

                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="text-center space-y-1.5 px-2">
                      <h3 className="font-playfair text-base font-bold text-[#203b31] decoration-1 underline-offset-4 group-hover:underline">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-inter text-sm font-semibold text-[#203b31]">
                          ₹{item.price.toLocaleString("en-IN")}
                        </span>
                        {item.originalPrice && (
                          <span className="font-inter text-[11px] text-wood-400 line-through">
                            ₹{item.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ==============================================================================
              AESTHETIC BANNER / BRAND STORY (Warm Wood Theme)
          ============================================================================== */}
          <section className="bg-[#e9eddf] text-[#203b31] border border-[#dde3d2] rounded-[2rem] p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-md">
            <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden opacity-10 pointer-events-none">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform scale-150 -translate-y-12">
                <path fill="#C4B299" d="M47.7,-67.2C59.9,-59.4,67,-44,72.4,-28.4C77.7,-12.8,81.4,3,76.5,16.4C71.6,29.8,58.2,40.8,44.9,50C31.5,59.3,18.3,66.8,3.2,62.3C-11.9,57.7,-25.1,41.1,-38.7,30.3C-52.2,19.5,-66,14.6,-71.2,5C-76.3,-4.5,-72.8,-18.8,-63.9,-29.4C-55,-40,-40.7,-46.9,-27.6,-54.3C-14.6,-61.7,-2.8,-69.5,10.2,-73.6C23.2,-77.7,35.5,-75,47.7,-67.2Z" transform="translate(100 100)" />
              </svg>
            </div>

            <div className="w-full md:w-1/2 space-y-6 relative z-10">
              <span className="font-outfit text-xs font-bold tracking-[0.2em] uppercase text-wood-700">A home that feels like you</span>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold leading-tight text-[#203b31]">
                Bring your space <br />
                <span className="italic font-normal text-slate-700">to life.</span>
              </h2>
              <p className="font-outfit text-sm text-slate-600 leading-loose max-w-md">
                Start with a piece you love. Browse our furniture, check the details and talk to our team when you need a little help deciding.
              </p>
              <div className="pt-4">
                <h4 className="font-playfair text-2xl italic text-wood-700">B. A1 Furnitures.</h4>
              </div>
            </div>

            <div className="w-full md:w-5/12 relative z-10">
              <div className="bg-white rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="space-y-2">
                  <h3 className="font-playfair text-2xl font-bold text-[#203b31]">Stay in the loop</h3>
                  <p className="font-outfit text-xs text-[#62755c]">Get furniture updates and news from Ballanki.</p>
                </div>
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-white border border-wood-200 px-4 py-3 text-sm font-outfit text-[#203b31] placeholder-wood-500 rounded-xl focus:outline-none focus:border-wood-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#203f34] hover:bg-[#315b49] text-white font-outfit text-xs uppercase tracking-widest font-bold py-3.5 rounded-xl transition-colors shadow-sm"
                  >
                    Keep me updated
                  </button>
                </form>
              </div>
            </div>
          </section>

        </div>

        <section className="mx-auto grid max-w-7xl grid-cols-2 gap-5 border-t border-[#e3e5dc] px-5 py-8 md:grid-cols-4">
          {[
            { icon: Truck, title: "Delivery information", desc: "Check charges at checkout", href: "/shipping" },
            { icon: RefreshCw, title: "Clear return policies", desc: "Read the details before you buy", href: "/returns" },
            { icon: Headphones, title: "Here to help", desc: "Talk to our store team", href: "/customer/support" },
            { icon: ShieldCheck, title: "Your orders, in one place", desc: "Follow your order progress", href: "/customer/orders" },
          ].map(({ icon: Icon, title, desc, href }) => <Link key={title} href={href} className="flex items-start gap-3"><Icon size={21} className="shrink-0 text-[#697b58]" /><div><h3 className="font-inter text-xs font-semibold">{title}</h3><p className="mt-1 text-[10px] leading-5 text-slate-500">{desc}</p></div></Link>)}
        </section>
      </main>

      <Footer />
    </div>
  );
}
