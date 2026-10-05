"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Calculator, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, getProductImage } from "@/lib/utils";

export default function CartPage() {
  const { cart, fetchCart, removeItem, addItem, isLoading } = useCartStore();
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleValidateCoupon = () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    setTimeout(() => {
      if (couponCode.trim().toUpperCase() === "OAK5000") {
        setCouponDiscount(5000);
        setCouponMsg("Premium Studio Voucher Applied: Flat ₹5,000 Off");
        toast.success("Voucher Applied!");
      } else {
        setCouponDiscount(0);
        setCouponMsg("Invalid or expired voucher code");
        toast.error("Invalid Voucher");
      }
      setIsValidating(false);
    }, 600);
  };

  const removeCoupon = () => { setCouponCode(""); setCouponDiscount(0); setCouponMsg(""); };

  const itemsList = cart?.items || [];
  const totalItemsCount = itemsList.reduce((acc, i) => acc + i.quantity, 0);
  const rawSubtotal = itemsList.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0);

  // Split calculations for Made to Order Pre-Orders vs standard fulfillment
  let totalAdvanceDepositRequired = 0;
  itemsList.forEach((item) => {
    const p = item.product;
    if (p.allow_pre_order && p.deposit_policy?.is_required) {
      if (p.deposit_policy.deposit_type === 'PERCENTAGE') {
        const depositPerItem = (p.price * p.deposit_policy.deposit_value) / 100;
        totalAdvanceDepositRequired += depositPerItem * item.quantity;
      } else if (p.deposit_policy.deposit_type === 'FIXED') {
        totalAdvanceDepositRequired += p.deposit_policy.deposit_value * item.quantity;
      }
    }
  });

  const deliveryCharges = rawSubtotal >= 100000 ? 0 : (rawSubtotal > 0 ? 1500 : 0);

  // Total Liability
  const finalTotalAmount = Math.max(0, rawSubtotal - couponDiscount + deliveryCharges);

  // Amount due today
  let dueToday = 0;
  if (totalAdvanceDepositRequired > 0) {
    // If there is any pre-order, the customer pays the deposit of pre-order items + full price of any ready-stock items + delivery - discount.
    const readyStockSubtotal = rawSubtotal - itemsList.filter(i => i.product.allow_pre_order).reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    dueToday = Math.max(0, totalAdvanceDepositRequired + readyStockSubtotal - couponDiscount + deliveryCharges);
  } else {
    dueToday = finalTotalAmount;
  }

  const balanceRemaining = finalTotalAmount - dueToday;

  const handleRemoveItem = (product_id: number) => {
    const cartItemId = itemsList.find(i => i.product_id === product_id)?.id;
    if (cartItemId) {
      removeItem(cartItemId);
      toast.success("Item removed from reservation");
    }
  };

  if (itemsList.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-wood-50 font-inter text-wood-900 border-t border-wood-200">
        <div className="w-28 h-28 bg-white border border-wood-200 rounded-full flex items-center justify-center text-wood-400 shadow-sm mb-6 relative">
          <ShoppingBag size={48} />
          <div className="absolute top-2 right-2 w-5 h-5 bg-terracotta-500 rounded-full border-2 border-white"></div>
        </div>
        <h2 className="font-playfair text-3xl mb-4 font-bold">Your Catalog is Empty</h2>
        <p className="text-wood-500 mb-8 max-w-sm text-center text-sm">Discover our handcrafted masterpieces and add them to your shopping bag to secure an order.</p>
        <Link
          href="/customer/products"
          className="bg-wood-900 hover:bg-wood-900 text-white px-8 py-3.5 rounded-lg font-bold shadow-md transition-all active:scale-[0.98]"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wood-50 text-wood-900 font-inter pb-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-10">
        <div className="mb-8">
          <h1 className="font-playfair text-3xl font-bold text-wood-900 mb-2">Shopping Bag</h1>
          <p className="text-sm text-wood-500 font-medium">You have {totalItemsCount} meticulously curated items in your bag</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left Block: Items */}
          <div className="flex-1 space-y-6">

            {/* Headers */}
            <div className="hidden md:grid grid-cols-12 gap-4 pb-3 border-b border-wood-200 text-xs font-bold text-wood-400 uppercase tracking-wider">
              <div className="col-span-6">Item</div>
              <div className="col-span-2 text-center">Unit Price</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* List */}
            <div className="space-y-6">
              {itemsList.map((item) => {
                const isMadeToOrder = item.product.allow_pre_order && item.product.deposit_policy?.is_required;
                let depositPerItem = 0;
                if (isMadeToOrder) {
                  depositPerItem = item.product.deposit_policy!.deposit_type === 'PERCENTAGE'
                    ? (item.product.price * item.product.deposit_policy!.deposit_value) / 100
                    : item.product.deposit_policy!.deposit_value;
                }

                return (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center bg-white p-5 rounded-2xl border border-wood-200 shadow-sm relative group">
                    <button
                      onClick={() => handleRemoveItem(item.product_id)}
                      className="absolute top-4 right-4 text-wood-300 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Img + Details */}
                    <div className="col-span-12 md:col-span-6 flex items-start gap-5">
                      <div className="w-24 h-24 bg-wood-50 rounded-xl overflow-hidden shrink-0 border border-wood-100">
                        <img src={getProductImage(item.product.images)} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="pr-6">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-wood-500 mb-1 block">
                          {item.product.category?.name || "Furniture"}
                        </span>
                        <Link href={`/customer/products/${item.product.id}`} className="font-playfair font-bold text-lg text-wood-900 group-hover:text-wood-600 transition-colors line-clamp-1 block mb-1">
                          {item.product.name}
                        </Link>
                        {item.product.wood_type && <p className="text-xs text-wood-500 font-medium">Finish: <span className="text-wood-900">{item.product.wood_type}</span></p>}

                        {isMadeToOrder && (
                          <div className="mt-2 bg-wood-800 text-wood-50 text-[10px] px-2 py-1 rounded inline-block font-bold tracking-wider uppercase border border-wood-700">
                            Made to Order
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unit Price */}
                    <div className="hidden md:block col-span-2 text-center mt-2 md:mt-0 font-medium text-wood-900">
                      {formatPrice(item.product.price)}
                    </div>

                    {/* Qty */}
                    <div className="col-span-12 md:col-span-2 flex items-center md:justify-center mt-4 md:mt-0 gap-3">
                      <span className="text-xs text-wood-500 font-bold uppercase md:hidden tracking-wider">QTY</span>
                      <div className="flex items-center gap-3 bg-wood-50 border border-wood-200 rounded-lg p-1.5 shadow-xs">
                        <button
                          onClick={() => {
                            if (item.quantity > 1) {
                              const newItem = { ...item, quantity: -1 }; // In cartStore, addItem with delta updates it
                              // Wait, our cartStore addItem does `newItems[existing].quantity += quantity`.
                              // So pass -1.
                              // But I don't export handleQty in pure Zustand, let's just use remove if <1
                              if (item.quantity > 1) addItem(item.product_id, -1);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-wood-600 shadow-sm border border-wood-100 hover:border-wood-300"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center text-xs font-bold text-wood-900">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item.product_id, 1)}
                          className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-wood-600 shadow-sm border border-wood-100 hover:border-wood-300"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Total (Mobile & Desktop) */}
                    <div className="col-span-12 md:col-span-2 md:text-right mt-2 md:mt-0 flex md:flex-col justify-between items-center md:items-end">
                      <span className="text-xs text-wood-500 font-bold uppercase md:hidden tracking-wider">Subtotal</span>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-wood-900">{formatPrice(item.product.price * item.quantity)}</span>
                        {isMadeToOrder && (
                          <span className="text-[10px] text-wood-500 font-medium mt-1 text-right max-w-[120px]">
                            Req. Deposit: <strong className="text-wood-900">{formatPrice(depositPerItem * item.quantity)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Block: Summary */}
          <div className="w-full lg:w-96 space-y-6">

            <div className="bg-white border border-wood-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
              <h3 className="font-playfair text-xl font-bold text-wood-900 mb-6">Order Summary</h3>

              {/* Voucher Area */}
              <div className="mb-6 z-10 relative">
                {!couponDiscount ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Studio Voucher Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-wood-50 border border-wood-200 px-4 py-2.5 rounded-lg text-xs font-semibold focus:outline-none focus:border-wood-900 text-wood-900"
                    />
                    <button
                      onClick={handleValidateCoupon}
                      disabled={isValidating || !couponCode}
                      className="bg-wood-900 text-white px-5 py-2.5 rounded-lg text-xs font-bold disabled:opacity-50"
                    >
                      {isValidating ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50/50 border border-green-200 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="text-xs font-bold text-green-800">{couponCode} Applied</span>
                    </div>
                    <button onClick={removeCoupon} className="text-[10px] font-bold text-red-500 uppercase">Remove</button>
                  </div>
                )}
                {couponMsg && !couponDiscount && (
                  <p className="text-[10px] text-red-500 mt-2 font-bold uppercase tracking-wider">{couponMsg}</p>
                )}
                {couponDiscount > 0 && <p className="text-[10px] text-green-600 mt-2 font-bold uppercase tracking-wider">{couponMsg}</p>}

                <p className="text-[10px] text-wood-500 mt-2 font-semibold">Hint: Use <span className="font-bold text-wood-900">OAK5000</span> for flat ₹5,000 off.</p>
              </div>

              {/* Line items */}
              <div className="space-y-3 text-sm text-wood-700 font-medium mb-6 z-10 relative">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span className="font-bold text-wood-900">{formatPrice(rawSubtotal)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Voucher Discount</span>
                    <span className="font-bold">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>White Glove Delivery</span>
                  <span className="font-bold text-wood-900">{deliveryCharges === 0 ? "Complimentary" : formatPrice(deliveryCharges)}</span>
                </div>
              </div>

              <div className="border-t border-wood-200 pt-6 pb-2 relative z-10">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-sm text-wood-900 uppercase tracking-wider">Total Value</span>
                  <span className="font-playfair font-bold text-2xl text-wood-900">{formatPrice(finalTotalAmount)}</span>
                </div>
                <p className="text-[10px] text-wood-400 font-semibold text-right uppercase tracking-wider mb-6">Inclusive of taxes</p>

                {/* Advanced Deposit Split info */}
                {balanceRemaining > 0 && (
                  <div className="flex flex-col gap-2 bg-wood-50 p-4 rounded-xl border border-wood-100 mb-6">
                    <span className="text-[11px] font-bold tracking-widest text-wood-500 uppercase">Payment Plan</span>
                    <div className="flex justify-between items-center text-sm font-bold text-wood-900">
                      <span>Due Today (Deposit)</span>
                      <span className="text-terracotta-600">{formatPrice(dueToday)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium text-wood-500">
                      <span>Remaining Balance (Due before Dispatch)</span>
                      <span>{formatPrice(balanceRemaining)}</span>
                    </div>
                  </div>
                )}

                <Link
                  href="/customer/orders/checkout"
                  className="w-full bg-wood-900 hover:bg-wood-950 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  <span>{balanceRemaining > 0 ? "Secure Pre-Order with Deposit" : "Proceed to Secure Checkout"}</span>
                  <ArrowRight size={16} />
                </Link>

                <p className="text-center text-[10px] text-wood-400 mt-4 flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider">
                  <ShieldCheck size={12} /> Expected Delivery within 30 days
                </p>
              </div>

              {/* Watermark in background */}
              <div className="absolute -right-4 -bottom-4 text-wood-100 font-playfair text-9xl font-bold italic opacity-20 pointer-events-none select-none">
                OH
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// CheckCircle2 needs importing but I missed it in lucide-react above.
// Re-adding it via a targeted edit or doing it silently here:
