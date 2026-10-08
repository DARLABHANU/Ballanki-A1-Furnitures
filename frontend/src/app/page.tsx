"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { productApi, api } from "@/lib/api";
import Footer from "@/components/layout/Footer";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import {
  Star, Heart, ArrowRight, ShieldCheck, Truck,
  RefreshCw, Headphones, MapPin, ChevronDown, Play, ChevronLeft, ChevronRight
} from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { getProductImage } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { wishlistIds, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { location: deliveryLocation, openModal } = useDeliveryLocationStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(false);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      img: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=2000",
      pill: "Carved Masterpieces",
      titleTop: "Royal Wooden",
      titleItalic: "Beds.",
      desc: "Transform your bedroom into a sanctuary with our masterfully hand-carved solid teak wood beds. Polished to perfection for a royal finish."
    },
    {
      img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=2000",
      pill: "Opulent Seating",
      titleTop: "Handcrafted",
      titleItalic: "Sofas.",
      desc: "Experience unmatched luxury with our intricately carved wooden sofas. Deep mahogany polish meets plush comfort for your living room."
    },
    {
      img: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&q=80&w=2000",
      pill: "Bespoke Details",
      titleTop: "Timeless",
      titleItalic: "Elegance.",
      desc: "Every curve and carving tells a story. Discover our premium collection of polished wooden furniture that lasts for generations."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

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
    <div className="min-h-screen bg-wood-50 text-wood-900 font-inter flex flex-col">
      <Navbar />

      <main className="flex-1 w-full pb-20">
        {/* ==============================================================================
            BRIGHT WOODEN HERO CAROUSEL SECTION 
        ============================================================================== */}
        <section className="relative w-full h-[65vh] md:h-[85vh] min-h-[480px] md:min-h-[600px] flex items-center justify-center bg-wood-100 overflow-hidden">

          {/* Images */}
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-0" : "opacity-0 -z-10"
                }`}
            >
              <img
                src={slide.img}
                alt={`Premium Furniture ${index}`}
                className="w-full h-full object-cover object-bottom"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-wood-50/95 md:from-wood-50/90 via-wood-50/60 to-transparent" />
            </div>
          ))}

          {/* Controls - Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-3 lg:left-5 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white backdrop-blur-md flex items-center justify-center text-wood-900 shadow-md transition-all hidden lg:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} className="mr-0.5" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 lg:right-5 z-20 w-10 h-10 rounded-full bg-white/70 hover:bg-white backdrop-blur-md flex items-center justify-center text-wood-900 shadow-md transition-all hidden lg:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={20} className="ml-0.5" />
          </button>

          {/* Content container */}
          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-20 w-full flex flex-col md:flex-row items-center justify-between gap-12">

            {/* Dynamic Text Content */}
            <div className="w-full md:w-[75%] lg:w-[60%] space-y-6 text-center md:text-left mt-0 min-h-[220px]">

              {/* Force React to re-trigger animations by keying the wrapper to currentSlide */}
              <div key={currentSlide} className="animate-fade-in space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-wood-300 rounded-full bg-white/50 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-wood-600 animate-pulse" />
                  <span className="font-outfit text-[10px] tracking-[0.2em] uppercase text-wood-800 font-bold">
                    {heroSlides[currentSlide].pill}
                  </span>
                </div>

                <h1 className="font-playfair text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-wide text-wood-900 leading-[1.15]">
                  {heroSlides[currentSlide].titleTop} <br className="hidden md:block" />
                  <span className="italic font-normal text-wood-700">{heroSlides[currentSlide].titleItalic}</span>
                </h1>

                <p className="font-outfit text-sm md:text-base text-wood-700 max-w-md mx-auto md:mx-0 font-medium leading-relaxed">
                  {heroSlides[currentSlide].desc}
                </p>
              </div>

              {/* Static Buttons below */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                <Link
                  href="/customer/products"
                  className="bg-wood-900 hover:bg-wood-800 text-white px-8 py-3.5 rounded-full font-outfit font-bold tracking-wide transition-all shadow-md text-sm flex items-center gap-2 group"
                >
                  Explore Collection
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={openModal}
                  className="hidden sm:flex bg-white/70 hover:bg-white border border-wood-200 text-wood-900 px-8 py-3.5 rounded-full font-outfit font-bold tracking-wide transition-all text-sm items-center gap-2 shadow-xs"
                >
                  <MapPin size={16} /> Delivery Setup
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full ${idx === currentSlide
                  ? "w-8 h-1.5 bg-wood-800"
                  : "w-1.5 h-1.5 bg-wood-400 hover:bg-wood-600"
                  }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

        </section>

        {/* ==============================================================================
            DELIVERY LOCATION STRIP (Mobile Only)
        ============================================================================== */}
        <div className="lg:hidden bg-wood-50 border-b border-wood-200 px-4 py-3 z-30 shadow-xs">
          <button
            onClick={openModal}
            className="flex items-center gap-2 text-xs font-outfit w-full text-left"
          >
            <MapPin size={16} className="text-wood-600 flex-shrink-0" />
            <span className="text-wood-500">Deliver to:</span>
            <span className="font-bold text-wood-900 truncate">
              {deliveryLocation ? `${deliveryLocation.district}, ${deliveryLocation.state}` : "Select location"}
            </span>
            <ChevronDown size={14} className="text-wood-400 ml-auto flex-shrink-0" />
          </button>
        </div>



        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 space-y-24">

          {/* ==============================================================================
              CURATED CATEGORIES
          ============================================================================== */}
          <section className="space-y-10">
            <div className="text-center space-y-3">
              <span className="font-outfit text-xs font-bold tracking-[0.2em] uppercase text-wood-500">Curations</span>
              <h2 className="font-playfair text-3xl md:text-4xl font-bold text-wood-900">Shop by Space</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: "Living Room", desc: "Mid-Century Cabinets, Coffee Tables, Accent Chairs", href: "/customer/products?category=living", img: "https://images.unsplash.com/photo-1597072689227-8882273e8f6a?auto=format&fit=crop&q=80&w=800" },
                { name: "Dining Space", desc: "Solid Oak Dining Sets & Sideboards", href: "/customer/products?category=dining", img: "https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&q=80&w=800" },
                { name: "The Bedroom", desc: "Polished Teak Bed Frames & Nightstands", href: "/customer/products?category=bedroom", img: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=800" },
              ].map((cat) => (
                <Link href={cat.href} key={cat.name} className="group relative h-[450px] rounded-2xl overflow-hidden block border border-wood-200">
                  <div className="absolute inset-0 bg-wood-900/10 group-hover:bg-wood-900/40 transition-colors duration-500 z-10" />
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 bg-wood-100" />
                  <div className="absolute inset-0 z-20 flex flex-col justify-end items-center text-center p-8 bg-gradient-to-t from-wood-900/90 via-wood-900/20 to-transparent">
                    <h3 className="font-playfair text-3xl font-bold text-white mb-1 tracking-wide">{cat.name}</h3>
                    <div className="h-10 mb-4 flex items-center justify-center w-full">
                      <p className="font-outfit text-xs text-wood-100 max-w-[90%] transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        {cat.desc}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 font-outfit text-[10px] font-bold text-white tracking-[0.2em] uppercase pb-1.5 border-b border-white/50 w-max mx-auto hover:border-white transition-colors">
                      Discover <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ==============================================================================
              FEATURED PRODUCTS
          ============================================================================== */}
          <section className="space-y-10 border-t border-wood-200 pt-16">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-center md:text-left">
                <span className="font-outfit text-xs font-bold tracking-[0.2em] uppercase text-wood-500">Masterpieces</span>
                <h2 className="font-playfair text-3xl md:text-4xl font-bold text-wood-900">Featured Collection</h2>
              </div>
              <Link href="/customer/products" className="font-outfit text-sm font-bold text-wood-600 hover:text-wood-900 transition-colors uppercase tracking-widest border-b border-wood-300 pb-1">
                View All
              </Link>
            </div>

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
                        className="absolute top-3 right-3 w-8 h-8 bg-white/70 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white border border-wood-200 shadow-sm z-10 transition-transform opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 duration-300"
                      >
                        <Heart size={14} className={isWished ? "fill-wood-600 text-wood-600" : "text-wood-900"} />
                      </button>

                      {/* Add to Cart Overlay Button */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          await addItem(item.id, 1);
                          toast.success("Added to cart");
                        }}
                        className="absolute bottom-4 left-4 right-4 bg-wood-900 text-white font-outfit text-xs font-bold py-3 rounded-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-10 hover:bg-wood-800"
                      >
                        + Add To Cart
                      </button>

                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 mix-blend-multiply opacity-95"
                      />
                    </div>

                    <div className="text-center space-y-1.5 px-2">
                      <h3 className="font-playfair text-base font-bold text-wood-900 decoration-1 underline-offset-4 group-hover:underline">
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-inter text-sm font-semibold text-wood-900">
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
          <section className="bg-wood-800 text-wood-50 rounded-[2rem] p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 shadow-md">
            <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden opacity-10 pointer-events-none">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform scale-150 -translate-y-12">
                <path fill="#C4B299" d="M47.7,-67.2C59.9,-59.4,67,-44,72.4,-28.4C77.7,-12.8,81.4,3,76.5,16.4C71.6,29.8,58.2,40.8,44.9,50C31.5,59.3,18.3,66.8,3.2,62.3C-11.9,57.7,-25.1,41.1,-38.7,30.3C-52.2,19.5,-66,14.6,-71.2,5C-76.3,-4.5,-72.8,-18.8,-63.9,-29.4C-55,-40,-40.7,-46.9,-27.6,-54.3C-14.6,-61.7,-2.8,-69.5,10.2,-73.6C23.2,-77.7,35.5,-75,47.7,-67.2Z" transform="translate(100 100)" />
              </svg>
            </div>

            <div className="w-full md:w-1/2 space-y-6 relative z-10">
              <span className="font-outfit text-xs font-bold tracking-[0.2em] uppercase text-wood-300">Our Heritage</span>
              <h2 className="font-playfair text-4xl md:text-5xl font-bold leading-tight text-white">
                Crafted for comfort, <br />
                <span className="italic font-normal text-wood-100">designed for life.</span>
              </h2>
              <p className="font-outfit text-sm text-wood-100/90 leading-loose max-w-md">
                At Ballanki A1 Furnitures, we believe that your home is an extension of your soul. We meticulously select premium Teak, Oak, and Walnut, marrying traditional joinery techniques with modern aesthetics.
              </p>
              <div className="pt-4">
                <h4 className="font-playfair text-2xl italic text-wood-300">B. A1 Furnitures.</h4>
              </div>
            </div>

            <div className="w-full md:w-5/12 relative z-10">
              <div className="bg-white rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="space-y-2">
                  <h3 className="font-playfair text-2xl font-bold text-wood-900">The Design Digest</h3>
                  <p className="font-outfit text-xs text-wood-600">Subscribe for exclusive pre-order access and curation tips.</p>
                </div>
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-wood-50 border border-wood-200 px-4 py-3 text-sm font-outfit text-wood-900 placeholder-wood-500 rounded-xl focus:outline-none focus:border-wood-500 transition-all"
                  />
                  <button
                    type="submit"
                    className="w-full bg-wood-900 hover:bg-wood-800 text-white font-outfit text-xs uppercase tracking-widest font-bold py-3.5 rounded-xl transition-colors shadow-sm"
                  >
                    Subscribe Now
                  </button>
                </form>
              </div>
            </div>
          </section>

        </div>

        {/* ==============================================================================
            TRUST BADGES BAR (Warm theme)
        ============================================================================== */}
        <div className="border-t border-wood-200 bg-white shadow-[-px_-4px_24px_rgba(43,24,3,0.03)] z-20 relative">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: <Truck size={24} className="text-wood-600" />, title: "White Glove Delivery", desc: "Expert assembly included" },
                { icon: <ShieldCheck size={24} className="text-wood-600" />, title: "Lifetime Warranty", desc: "Craftsmanship guaranteed" },
                { icon: <RefreshCw size={24} className="text-wood-600" />, title: "Bespoke Requests", desc: "Customized to your vision" },
                { icon: <Headphones size={24} className="text-wood-600" />, title: "Concierge Support", desc: "24/7 dedicated assistance" },
              ].map((badge, idx) => (
                <div key={idx} className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left group">
                  <div className="w-12 h-12 rounded-full bg-wood-50 flex items-center justify-center group-hover:bg-wood-100 transition-colors border border-wood-200">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="font-outfit font-bold text-wood-900 text-sm md:text-base">{badge.title}</h4>
                    <p className="font-inter text-[11px] text-wood-600 mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
