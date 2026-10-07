"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, MessageCircle, Clock, CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";
import { Product } from "@/types";
import { formatPrice, getProductImage, getApiError } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { toggleWishlist, isWishlisted } = useWishlistStore();
  const [isAdding, setIsAdding] = useState(false);
  const wishlisted = isWishlisted(product.id);

  // Compute discount percentage
  const origPrice = product.compare_price || (product as any).original_price || 0;
  const discount = origPrice > product.price
    ? Math.round(((origPrice - product.price) / origPrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please sign in to add to cart");
      return;
    }
    setIsAdding(true);
    try {
      await addItem(product.id, 1, product);
      toast.success(product.allow_pre_order ? "Pre-order added!" : "Added to bag!");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleNegotiateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // In actual implementation, we might popup a modal or redirect
    window.location.href = `/customer/products/${product.id}?bargain=true`;
  };

  const isMadeToOrder = product.fulfillment_type === 'MADE_TO_ORDER' || product.fulfillment_type === 'CUSTOM_ORDER';

  return (
    <div className="bg-white border border-wood-200 rounded-lg p-4 flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300 group font-inter text-wood-900 relative overflow-hidden">
      <Link href={`/customer/products/${product.id}`} className="flex-1 flex flex-col">
        {/* Product Image */}
        <div className="relative aspect-[4/3] sm:aspect-square overflow-hidden bg-wood-50 mb-4 rounded-xl border border-wood-100">
          <img
            src={getProductImage(product.images)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 400'%3E%3Crect width='300' height='400' fill='%23F8F5F0'/%3E%3Ctext x='150' y='200' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23B3B3B3'%3ENo Image%3C/text%3E%3C/svg%3E`;
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded shadow-sm ${isMadeToOrder ? "bg-wood-800 text-white" : "bg-wood-200 text-wood-900"}`}>
              {isMadeToOrder ? "Made to Order" : "Ready Stock"}
            </span>
            {product.is_featured && (
              <span className="bg-gold-500 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-sm uppercase">
                Featured
              </span>
            )}
            {product.stock_quantity === 0 && !product.allow_pre_order && (
              <span className="bg-wood-700 text-white text-[10px] font-bold tracking-wider px-2 py-1 rounded shadow-sm uppercase">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isAuthenticated) {
                toast.error("Please sign in to save to wishlist");
                return;
              }
              try {
                const added = await toggleWishlist(product.id);
                toast.success(added ? "Added to wishlist" : "Removed from wishlist");
              } catch (err) {
                toast.error(getApiError(err));
              }
            }}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center transition-all ${wishlisted ? "text-terracotta-600 fill-terracotta-600" : "text-wood-600 hover:text-terracotta-600"
              } shadow`}
          >
            <Heart size={15} className={wishlisted ? "fill-current text-red-600" : ""} />
          </button>
        </div>

        {/* Product Details */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between text-xs text-wood-500 font-medium mb-1">
            <span className="uppercase tracking-widest truncate">{product.category?.name || "Furniture"}</span>
            {product.material && <span>{product.material}</span>}
          </div>

          <h3 className="font-playfair font-semibold text-lg text-wood-900 line-clamp-1 group-hover:text-gold-600 transition-colors">
            {product.name}
          </h3>

          {(product.wood_type || product.dimensions) && (
            <div className="text-[11px] text-wood-500 mt-0.5 mb-2 line-clamp-1 flex items-center gap-2">
              {product.wood_type && <span className="font-semibold">{product.wood_type}</span>}
              {product.wood_type && product.dimensions && <span className="w-1 h-1 rounded-full bg-wood-300"></span>}
              {product.dimensions && <span>{typeof product.dimensions === 'string' ? product.dimensions : `${product.dimensions.length}x${product.dimensions.width}x${product.dimensions.height} ${product.dimensions.unit}`}</span>}
            </div>
          )}

          {/* Price section */}
          <div className="flex items-end gap-2 my-2">
            <span className="font-outfit font-medium text-xl text-wood-900">{formatPrice(product.price)}</span>
            {origPrice > product.price && (
              <>
                <span className="text-sm text-wood-400 line-through mb-0.5">{formatPrice(origPrice)}</span>
                <span className="text-[11px] font-bold text-green-700 mb-0.5 ml-1 bg-green-50 px-1 rounded">-{discount}%</span>
              </>
            )}
          </div>

          {/* Estimate Display */}
          {isMadeToOrder && (product.manufacturing_duration_days ?? 0) > 0 && (
            <div className="bg-wood-50 rounded p-2 mt-auto mb-2 text-xs text-wood-700 space-y-1 border border-wood-100">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock size={12} className="text-wood-500" />
                <span>Est. Making time: {product.manufacturing_duration_days} days</span>
              </div>
              {(product.shipping_duration_days ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 opacity-80">
                  <CalendarIcon size={12} className="text-wood-500" />
                  <span>+{product.shipping_duration_days} days shipping</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || (product.stock_quantity === 0 && !product.allow_pre_order)}
          className="flex-1 bg-wood-900 hover:bg-wood-800 text-white py-2.5 rounded text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShoppingBag size={14} />
          <span>{product.allow_pre_order ? (isAdding ? "Adding..." : "Pre-order") : (isAdding ? "Adding..." : "Add to Cart")}</span>
        </button>

        <button
          onClick={handleNegotiateClick}
          className="px-3 bg-white border border-wood-300 hover:border-wood-900 hover:bg-wood-50 text-wood-900 rounded flex items-center justify-center transition-all"
          title="Negotiate Price"
        >
          <MessageCircle size={15} />
        </button>
      </div>
    </div>
  );
}
