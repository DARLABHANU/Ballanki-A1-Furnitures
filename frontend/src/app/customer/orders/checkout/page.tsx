"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Plus, MapPin, Tag, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, getProductImage } from "@/lib/utils";

const addressSchema = z.object({
  label: z.string().default("Home"),
  full_name: z.string().min(2, "Full name must be at least 2 characters").regex(/^[a-zA-Z\s]{2,50}$/, "Full name must contain only letters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"),
  line1: z.string().min(5, "Address Line 1 must be at least 5 characters"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit Indian PIN code"),
  country: z.string().default("India"),
});
type AddressForm = z.infer<typeof addressSchema>;

function CheckoutContent() {
  const router = useRouter();
  const { cart, clearCart } = useCartStore();

  const [addresses, setAddresses] = useState<any[]>([
    {
      id: 1,
      label: "Home",
      full_name: "Premium Guest",
      phone: "9876543210",
      line1: "123 Oak Avenue",
      city: "Mumbai",
      state: "MH",
      pincode: "400001",
      country: "India"
    }
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState<number>(1);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [typedCoupon, setTypedCoupon] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
  });

  const onAddAddress = (data: AddressForm) => {
    const newAddr = { ...data, id: Date.now() };
    setAddresses([...addresses, newAddr]);
    setSelectedAddressId(newAddr.id);
    setShowNewAddress(false);
    reset();
  };

  const validateTypedCoupon = () => {
    if (typedCoupon.toUpperCase() === "OAK5000") {
      setCouponCode("OAK5000");
      setCouponDiscount(5000);
      toast.success("Voucher Applied");
    } else {
      toast.error("Invalid Voucher");
    }
  };

  const handlePlaceOrder = () => {
    if (cart?.items.length === 0) return;
    setIsPlacing(true);

    // Simulate Razorpay and backend save
    setTimeout(() => {
      clearCart();
      toast.success("Order Placed Successfully!");
      router.push("/customer/orders?success=true");
    }, 1500);
  };

  const itemsList = cart?.items || [];
  const rawSubtotal = itemsList.reduce((acc, i) => acc + (i.product?.price || 0) * i.quantity, 0);
  const deliveryCharges = rawSubtotal >= 100000 ? 0 : (rawSubtotal > 0 ? 1500 : 0);
  const finalTotalAmount = Math.max(0, rawSubtotal - couponDiscount + deliveryCharges);

  let totalAdvanceDepositRequired = 0;
  let hasMadeToOrder = false;
  itemsList.forEach((item) => {
    const p = item.product;
    if (p.allow_pre_order && p.deposit_policy?.is_required) {
      hasMadeToOrder = true;
      if (p.deposit_policy.deposit_type === 'PERCENTAGE') {
        totalAdvanceDepositRequired += ((p.price * p.deposit_policy.deposit_value) / 100) * item.quantity;
      } else if (p.deposit_policy.deposit_type === 'FIXED') {
        totalAdvanceDepositRequired += (p.deposit_policy.deposit_value) * item.quantity;
      }
    }
  });

  let dueToday = finalTotalAmount;
  if (totalAdvanceDepositRequired > 0) {
    const readyStockSubtotal = rawSubtotal - itemsList.filter(i => i.product.allow_pre_order).reduce((acc, i) => acc + i.product.price * i.quantity, 0);
    dueToday = Math.max(0, totalAdvanceDepositRequired + readyStockSubtotal - couponDiscount + deliveryCharges);
  }
  const balanceRemaining = finalTotalAmount - dueToday;

  if (itemsList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-playfair font-bold mb-4">Your Cart is Empty</h2>
        <button onClick={() => router.push("/customer/products")} className="bg-wood-900 text-white px-6 py-2 rounded">Return to Shop</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-inter text-wood-900">

      <div className="mb-8">
        <h1 className="font-playfair text-3xl font-bold text-wood-900 mb-2">Secure Checkout</h1>
        <p className="text-sm text-wood-500 font-medium tracking-wide">Complete your reservation of handcrafted luxury</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-2xl border border-wood-200 shadow-sm relative">
            <h2 className="font-playfair text-xl font-bold text-wood-900 mb-6 flex items-center justify-between">
              <span>1. Delivery Address</span>
              {!showNewAddress && (
                <button onClick={() => setShowNewAddress(true)} className="text-xs text-wood-900 hover:text-wood-500 flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <Plus size={14} /> New Address
                </button>
              )}
            </h2>

            {showNewAddress ? (
              <form onSubmit={handleSubmit(onAddAddress)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-wood-500 uppercase mb-1">Full Name</label>
                    <input {...register("full_name")} className="w-full border border-wood-200 rounded p-2 text-sm focus:border-wood-900 focus:outline-none" />
                    {errors.full_name && <p className="text-[10px] text-red-500 mt-1">{errors.full_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wood-500 uppercase mb-1">Mobile</label>
                    <input {...register("phone")} className="w-full border border-wood-200 rounded p-2 text-sm focus:border-wood-900 focus:outline-none" />
                    {errors.phone && <p className="text-[10px] text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-wood-500 uppercase mb-1">Address Line 1</label>
                  <input {...register("line1")} className="w-full border border-wood-200 rounded p-2 text-sm focus:border-wood-900 focus:outline-none" />
                  {errors.line1 && <p className="text-[10px] text-red-500 mt-1">{errors.line1.message}</p>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-wood-500 uppercase mb-1">City</label>
                    <input {...register("city")} className="w-full border border-wood-200 rounded p-2 text-sm focus:border-wood-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wood-500 uppercase mb-1">State</label>
                    <input {...register("state")} className="w-full border border-wood-200 rounded p-2 text-sm focus:border-wood-900 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-wood-500 uppercase mb-1">Pincode</label>
                    <input {...register("pincode")} className="w-full border border-wood-200 rounded p-2 text-sm focus:border-wood-900 focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowNewAddress(false)} className="text-xs font-bold text-wood-500 hover:text-wood-900 uppercase">Cancel</button>
                  <button type="submit" className="bg-wood-900 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase transition-colors">Save Delivery Address</button>
                </div>
              </form>
            ) : (
              <div className="grid gap-3">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressId === a.id ? "border-wood-900 bg-wood-50/50 scale-[1.01]" : "border-wood-100 hover:border-wood-300"}`}
                  >
                    <input type="radio" checked={selectedAddressId === a.id} onChange={() => setSelectedAddressId(a.id)} className="mt-1 accent-wood-900" />
                    <div>
                      <h4 className="font-bold text-wood-900">{a.full_name} <span className="bg-wood-200 text-wood-600 text-[10px] px-1.5 py-0.5 rounded ml-2 uppercase">Home</span></h4>
                      <p className="text-sm text-wood-500 mt-1">{a.line1}, {a.city}, {a.state} {a.pincode}</p>
                      <p className="text-sm text-wood-500 mt-1 font-medium">{a.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
            {/* Watermark in background */}
            <div className="absolute right-4 top-4 text-wood-100 font-playfair text-6xl font-bold italic opacity-30 select-none pointer-events-none">
              1
            </div>
          </div>

          {/* Mocked Payment method lock */}
          <div className="bg-white p-6 rounded-2xl border border-wood-200 shadow-sm relative overflow-hidden">
            <h2 className="font-playfair text-xl font-bold text-wood-900 mb-6 border-b border-wood-100 pb-2">2. Secure Payment</h2>

            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-wood-900 bg-wood-50 shadow-sm cursor-pointer">
              <input type="radio" readOnly checked className="mt-1 accent-wood-900" />
              <div>
                <h4 className="font-bold text-wood-900 flex items-center gap-2">Credit Card / UPI / NetBanking <ShieldCheck size={16} className="text-green-600" /></h4>
                <p className="text-xs text-wood-500 mt-1">Transactions are secured by 256-bit AES encryption.</p>
              </div>
            </label>
            <div className="absolute right-4 bottom-4 text-wood-100 font-playfair text-6xl font-bold italic opacity-30 select-none pointer-events-none">
              2
            </div>
          </div>
        </div>

        {/* SUMMARY (Col 5) */}
        <div className="lg:col-span-5 relative">
          <div className="bg-wood-950 p-7 rounded-2xl shadow-xl sticky top-24 text-wood-100">
            <h3 className="font-playfair text-2xl font-bold text-white mb-6">Reservation Details</h3>

            <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto scrollbar-none pr-2">
              {itemsList.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-wood-800 rounded-lg overflow-hidden shrink-0">
                    <img src={getProductImage(item.product.images)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm line-clamp-1">{item.product.name}</p>
                    <p className="text-[10px] text-wood-400 mt-1 font-semibold uppercase tracking-wider border border-wood-700 inline-block px-1.5 py-0.5 rounded">{item.product.category?.name || "Piece"}</p>
                    <div className="flex justify-between items-center mt-2 text-sm font-semibold">
                      <span>Qty: {item.quantity}</span>
                      <span>{formatPrice(item.product.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-wood-800 pt-6 space-y-3 text-sm font-medium">
              <div className="flex justify-between text-wood-300">
                <span>Value of Goods</span>
                <span>{formatPrice(rawSubtotal)}</span>
              </div>
              <div className="flex justify-between text-wood-300">
                <span>White Glove Shipping</span>
                <span className="text-white">{deliveryCharges === 0 ? "Complimentary" : formatPrice(deliveryCharges)}</span>
              </div>

              {/* Voucher */}
              {!couponCode ? (
                <div className="flex gap-2 mt-4 pt-4 border-t border-wood-800">
                  <input type="text" value={typedCoupon} onChange={e => setTypedCoupon(e.target.value)} placeholder="Voucher Code" className="flex-1 bg-wood-900 border border-wood-700 px-3 py-2 rounded text-xs focus:outline-none focus:border-wood-500" />
                  <button onClick={validateTypedCoupon} className="bg-wood-100 text-wood-900 px-4 py-2 rounded text-xs font-bold uppercase transition-colors hover:bg-white">Apply</button>
                </div>
              ) : (
                <div className="flex justify-between text-terracotta-400 font-bold mt-4 pt-4 border-t border-wood-800">
                  <span>Voucher: {couponCode}</span>
                  <span>- {formatPrice(couponDiscount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-wood-800 mt-6 pt-6 mb-6">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold uppercase tracking-wider text-wood-300">Total Obligation</span>
                <span className="font-playfair text-2xl font-bold text-white">{formatPrice(finalTotalAmount)}</span>
              </div>

              {hasMadeToOrder && (
                <div className="mt-6 bg-wood-900 p-4 rounded-xl border border-wood-700">
                  <p className="text-[10px] font-bold text-wood-400 tracking-wider uppercase mb-3 flex items-center justify-between">
                    Payment Plan
                    <AlertTriangle size={12} className="text-amber-500" />
                  </p>
                  <div className="flex justify-between items-center text-sm text-wood-100 font-bold mb-1">
                    <span>Advance Deposit (Due Now)</span>
                    <span className="text-amber-500">{formatPrice(dueToday)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-wood-400 font-medium">
                    <span>Balance Due Upon Completion</span>
                    <span>{formatPrice(balanceRemaining)}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacing || !selectedAddressId}
              className="w-full bg-wood-100 text-wood-900 font-extrabold tracking-wide uppercase py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-white transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isPlacing ? <Loader2 size={16} className="animate-spin" /> : <>{balanceRemaining > 0 ? `Pay Advance ${formatPrice(dueToday)}` : `Complete Payment ${formatPrice(dueToday)}`} <ArrowRight size={16} /></>}
            </button>
            <p className="text-center text-[10px] text-wood-500 mt-4 leading-tight">By completing this reservation, you agree to the custom order policies of Ballanki A1 Furnitures Studio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-wood-900" size={32} /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
