"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Heart, Share2, Star, ShoppingBag, Loader2,
  ShieldCheck, RefreshCw, CheckCircle2, User, Truck, Clock, ArrowRight, MessageSquare, Send, Calendar, Navigation, Info, FileText, X, Sparkles, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { formatPrice, getProductImage, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import BargainPanel from "@/components/customer/BargainPanel";
import { productApi } from "@/lib/api";
import ProductCard from "@/components/customer/ProductCard";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const { location: deliveryLocation, openModal } = useDeliveryLocationStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isBargainMode, setIsBargainMode] = useState(false);
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    productApi.get(Number(id))
      .then((res: any) => {
        const p = res.data;
        setProduct(p);

        // Fetch similar
        productApi.list({ limit: 4 }).then((similarRes: any) => {
          const items = similarRes.data.items || similarRes.data.data || [];
          setSimilarProducts(items.filter((x: Product) => x.id !== p.id).slice(0, 4));
        });
      })
      .catch((err: any) => {
        console.error(err);
        toast.error("Failed to load product details.");
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [id]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-wood-50">
        <div className="flex flex-col items-center gap-4 text-wood-500 font-bold loading-pulse">
          <Loader2 className="animate-spin text-wood-900" size={32} />
          LOADING MASTERPIECE...
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="h-screen flex flex-col items-center justify-center bg-wood-50 text-wood-900 font-playfair font-bold text-3xl">
      Masterpiece Not Found
      <Link href="/customer/products" className="mt-6 text-sm font-inter bg-charcoal-900 text-white px-6 py-3 rounded-lg shadow-sm">
        Return to Gallery
      </Link>
    </div>
  );

  const imagesList = product.images && product.images.length > 0 ? product.images : [];
  const origPrice = product.compare_price || (product as any).original_price || 0;
  const discountPercent = origPrice > product.price ? Math.round(((origPrice - product.price) / origPrice) * 100) : 0;
  const isMadeToOrder = product.fulfillment_type === 'MADE_TO_ORDER' || product.fulfillment_type === 'CUSTOM_ORDER';

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    await addItem(product.id, 1);
    toast.success(product.allow_pre_order ? "Pre-order reserved!" : "Added to Shopping Bag!");
  };

  const startBargain = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to negotiate price");
      router.push("/auth/login");
      return;
    }
    setIsBargainMode(true);
  };

  return (
    <div className="min-h-screen bg-wood-50 text-wood-900 font-inter relative overflow-hidden">

      {/* Top Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 text-xs font-semibold text-wood-500 tracking-wider">
        <Link href="/" className="hover:text-charcoal-900 transition-colors">HOME</Link>
        <span className="mx-2">/</span>
        <Link href="/customer/products" className="hover:text-charcoal-900 transition-colors">CATALOG</Link>
        {product.category && (
          <>
            <span className="mx-2">/</span>
            <Link href={`/customer/products?category=${product.category.slug}`} className="hover:text-charcoal-900 transition-colors uppercase">
              {product.category.name}
            </Link>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* Left: Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-[4/3] bg-white rounded-2xl border border-wood-200 overflow-hidden relative shadow-sm">
              {imagesList.length > 0 ? (
                <img
                  src={imagesList[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-wood-400">
                  No Image Available
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded shadow-sm ${isMadeToOrder ? "bg-wood-800 text-white" : "bg-white text-wood-900"}`}>
                  {isMadeToOrder ? "Made to Order" : "Ready Stock"}
                </span>
              </div>
            </div>

            {/* Thumbnails */}
            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === idx ? "border-wood-900 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info (6 cols) */}
          <div className="lg:col-span-6 flex flex-col pt-2 lg:pt-6">

            {/* Title & Brand */}
            <div className="mb-6">
              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal-900 leading-tight mb-3">
                {product.name}
              </h1>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-wood-600 uppercase tracking-widest flex items-center gap-1.5">
                  By <span className="text-wood-900 underline decoration-wood-300 underline-offset-4">{product.merchant?.business_name || "Ballanki A1 Furnitures"}</span>
                </p>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded text-amber-700 font-bold text-[11px]">
                  <Star size={12} className="fill-current" />
                  <span>{product.rating_avg > 0 ? product.rating_avg.toFixed(1) : "New"}</span>
                </div>
              </div>
            </div>

            {/* Price section */}
            <div className="mb-6 bg-white p-5 md:p-6 rounded-2xl border border-wood-200 shadow-sm relative">
              <div className="flex items-baseline gap-3 relative z-10">
                <span className="font-semibold text-3xl text-charcoal-900 tracking-tight">{formatPrice(product.price)}</span>
                {discountPercent > 0 && (
                  <>
                    <span className="text-wood-500 line-through text-lg">{formatPrice(origPrice)}</span>
                    <span className="bg-wood-900 text-wood-50 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                      Save {discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] font-semibold text-wood-400 uppercase tracking-wider mt-2 relative z-10">Inclusive of all taxes</p>

              {/* Watermark in background */}
              <div className="absolute right-4 bottom-4 text-wood-100 font-playfair text-6xl font-bold italic opacity-30 select-none">
                Elite
              </div>

              {/* Deposit Banner */}
              {product.allow_pre_order && product.deposit_policy?.is_required && (
                <div className="mt-5 p-4 rounded-xl bg-wood-50 border border-wood-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-bold text-wood-500 tracking-wider uppercase">Advance Required</span>
                    <span className="text-sm font-bold text-charcoal-900">
                      {product.deposit_policy.deposit_type === 'PERCENTAGE'
                        ? `${product.deposit_policy.deposit_value}%`
                        : formatPrice(product.deposit_policy.deposit_value)}
                    </span>
                  </div>
                  <p className="text-[10px] text-wood-500 leading-relaxed">
                    Secure this custom piece today with a partial deposit. The remaining balance will be collected upon completion before dispatch.
                  </p>
                </div>
              )}
            </div>

            {/* Furniture Details / Specs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.wood_type && (
                <div className="bg-white p-3.5 rounded-xl border border-wood-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-wood-100 flex items-center justify-center shrink-0">🌲</div>
                  <div>
                    <p className="text-[10px] font-bold text-wood-400 uppercase tracking-wider">Finish</p>
                    <p className="text-sm font-bold text-charcoal-900">{product.wood_type}</p>
                  </div>
                </div>
              )}
              {product.material && product.material !== "None" && (
                <div className="bg-white p-3.5 rounded-xl border border-wood-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-wood-100 flex items-center justify-center shrink-0">🧵</div>
                  <div>
                    <p className="text-[10px] font-bold text-wood-400 uppercase tracking-wider">Upholstery</p>
                    <p className="text-sm font-bold text-charcoal-900">{product.material}</p>
                  </div>
                </div>
              )}
              {product.dimensions && (
                <div className="bg-white p-3.5 rounded-xl border border-wood-100 flex items-center gap-3 col-span-2">
                  <div className="w-8 h-8 rounded-full bg-wood-100 flex items-center justify-center shrink-0">📏</div>
                  <div>
                    <p className="text-[10px] font-bold text-wood-400 uppercase tracking-wider">Dimensions</p>
                    <p className="text-sm font-bold text-charcoal-900">
                      {typeof product.dimensions === 'string'
                        ? product.dimensions
                        : `${product.dimensions.length}L x ${product.dimensions.width}W x ${product.dimensions.height}H ${product.dimensions.unit}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Estimate Block */}
            {product.provisional_estimate && (
              <div className="mb-8 bg-charcoal-900 text-wood-50 p-5 rounded-2xl shadow-sm">
                <h4 className="text-[11px] font-bold tracking-widest text-wood-400 uppercase mb-4 flex items-center gap-2">
                  <Clock size={14} /> Production & Delivery Snapshot
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-wood-300">Manufacturing Duration:</span>
                    <span className="font-bold">{product.manufacturing_duration_days} Days</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-wood-700 pb-4">
                    <span className="font-semibold text-wood-300">Shipping Duration:</span>
                    <span className="font-bold">{product.shipping_duration_days} Days</span>
                  </div>
                  <div className="flex justify-between items-center bg-wood-800 p-3 rounded-xl border border-wood-600">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-wood-400 uppercase">Est. Arrival Date</p>
                      <p className="text-[13px] font-semibold text-wood-300 mt-1">If placed today</p>
                    </div>
                    <span className="font-bold text-base text-wood-100">
                      ~ {formatDate(product.provisional_estimate.estimated_delivery_date)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mt-auto">
              {product.allow_pre_order || product.stock_quantity > 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-charcoal-900 hover:bg-wood-950 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
                >
                  <ShoppingBag size={18} />
                  <span>{product.allow_pre_order && product.deposit_policy?.is_required ? "Secure Pre-Order with Deposit" : "Add to Shopping Bag"}</span>
                </button>
              ) : (
                <button disabled className="w-full bg-wood-200 text-wood-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                  <span>Out of Stock</span>
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={startBargain}
                  className="bg-white border-2 border-wood-800 text-wood-900 hover:bg-wood-800 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare size={16} />
                  <span>Negotiate Option</span>
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`bg-white border ${isWishlisted(product.id) ? "border-terracotta-500 text-terracotta-600" : "border-wood-300 text-wood-700"} hover:bg-wood-50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all`}
                >
                  <Heart size={16} className={isWishlisted(product.id) ? "fill-current text-terracotta-500" : ""} />
                  <span>{isWishlisted(product.id) ? "Saved" : "Save to Wishlist"}</span>
                </button>
              </div>
            </div>

            {/* Service Guaratees */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-wood-200">
              <div className="flex items-center gap-2 text-wood-700">
                <ShieldCheck size={18} className="text-wood-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">Secure Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-wood-700">
                <Truck size={18} className="text-wood-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">White Glove</span>
              </div>
              <div className="flex items-center gap-2 text-wood-700">
                <RefreshCw size={18} className="text-wood-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">7-Day Returns</span>
              </div>
              <div className="flex items-center gap-2 text-wood-700">
                <CheckCircle2 size={18} className="text-wood-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">Verified Woods</span>
              </div>
            </div>

          </div>
        </div>

        {/* Similar Items (Mocked) */}
        {similarProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-wood-200">
            <h2 className="font-playfair text-2xl font-bold text-charcoal-900 mb-8 text-center">Complementary Pieces</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bargain slideover Panel using the dummy UI */}
      {isBargainMode && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsBargainMode(false)}></div>
          <div className="relative w-full max-w-md bg-wood-50 h-full shadow-2xl flex flex-col pointer-events-auto">
            {/* Bargain Panel Header */}
            <div className="p-5 border-b border-wood-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="font-playfair font-bold text-xl text-charcoal-900 flex items-center gap-2">
                  <Sparkles size={16} className="text-wood-500" /> Virtual Concierge
                </h3>
                <p className="text-[10px] text-wood-500 font-bold uppercase tracking-wider mt-1">Direct from the Atelier</p>
              </div>
              <button onClick={() => setIsBargainMode(false)} className="w-8 h-8 bg-wood-50 rounded-full flex items-center justify-center hover:bg-wood-200 transition-colors"><X size={16} className="text-wood-600" /></button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-wood-50 scrollbar-none flex flex-col">
              {/* Context Header */}
              <div className="p-4 bg-white border-b border-wood-100 flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img src={imagesList[0]} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal-900 line-clamp-1">{product.name}</h4>
                  <p className="text-xs text-wood-500 mb-1">Listed Price: <strong className="text-charcoal-900">{formatPrice(product.price)}</strong></p>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-900 bg-wood-100 px-2 py-0.5 rounded border border-wood-200">
                    Negotiation Context
                  </span>
                </div>
              </div>

              {/* Chat Arena */}
              <div className="p-5 flex-1 flex flex-col space-y-4">
                {/* System Message */}
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white border border-wood-200 p-3.5 rounded-2xl rounded-tl-sm shadow-sm text-sm text-wood-700">
                    <p>Greetings. I am the atelier concierge. How may I assist you with acquiring the <strong className="text-charcoal-900">{product.name}</strong> today?</p>
                    <span className="text-[9px] text-wood-400 font-bold uppercase tracking-wider block mt-2">Just now</span>
                  </div>
                </div>

                {!isAuthenticated ? (
                  <div className="mt-6">
                    <div className="bg-white border-2 border-wood-200 rounded-xl p-5 text-center shadow-sm">
                      <ShieldCheck size={28} className="text-wood-400 mx-auto mb-3" />
                      <h4 className="font-playfair text-lg font-bold text-charcoal-900 mb-2">Sign in to Negotiate</h4>
                      <p className="text-xs text-wood-500 mb-5 leading-relaxed">
                        Authentication is required to send private messages, submit secure price offers, and continue the conversation with the studio.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Link href={`/auth/login?redirect=/customer/products/${product.id}&negotiate=true`} className="w-full bg-charcoal-900 text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-wood-950 transition-colors shadow">
                          Sign In Securely
                        </Link>
                        <Link href={`/auth/signup?redirect=/customer/products/${product.id}&negotiate=true`} className="w-full bg-white border border-wood-300 text-wood-600 font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-wood-50 hover:text-charcoal-900 transition-colors">
                          Create Account
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Demo User Message */}
                    <div className="flex justify-end mt-4">
                      <div className="max-w-[85%] bg-charcoal-900 text-white p-3.5 rounded-2xl rounded-tr-sm shadow-sm text-sm">
                        <p>I am interested, but could we negotiate the terms?</p>
                        <span className="text-[9px] text-wood-400 font-bold uppercase tracking-wider block mt-2 text-right">Draft Message</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Input Area (Only visible/enabled if authenticated) */}
            <div className="p-4 bg-white border-t border-wood-200">
              <div className="flex gap-2">
                <input
                  disabled={!isAuthenticated}
                  type="text"
                  placeholder={isAuthenticated ? "Type your message or offer..." : "Please sign in to reply..."}
                  className="flex-1 bg-wood-50 border border-wood-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-charcoal-900 text-charcoal-900 disabled:opacity-50"
                />
                <button disabled={!isAuthenticated} className="w-12 h-11 bg-charcoal-900 hover:bg-wood-950 rounded-xl flex items-center justify-center transition-colors shadow-sm disabled:opacity-50">
                  <span className="text-white font-bold text-xs">Send</span>
                </button>
              </div>
              {!isAuthenticated && (
                <p className="text-[10px] text-center text-wood-400 font-bold uppercase tracking-widest mt-3 flex items-center justify-center gap-1">
                  Authentication Required
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
