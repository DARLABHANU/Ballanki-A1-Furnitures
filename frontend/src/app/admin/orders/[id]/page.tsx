"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, getApiError } from "@/lib/utils";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await adminApi.order(params.id); setOrder(data); }
    catch (err) { setError(getApiError(err)); setOrder(null); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { if (!isAuthenticated || role !== "admin") { router.replace("/auth/login"); return; } void load(); }, [isAuthenticated, role, router, load]);

  if (loading) return <div className="flex h-80 items-center justify-center"><Loader2 className="animate-spin"/></div>;
  return <section className="space-y-5 text-wood-900 font-garamond">
    <header className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><button onClick={() => router.push("/admin/orders")} className="rounded-full border bg-white p-2" aria-label="Back to orders"><ArrowLeft size={16}/></button><div><h1 className="font-cormorant text-3xl font-bold">Order details</h1><p className="text-xs text-[#666]">{order?.order_number || "Order"}</p></div></div><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs"><Printer size={14}/>Print</button></header>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button onClick={() => void load()} className="inline-flex items-center gap-1 font-bold underline"><RefreshCw size={13}/>Retry</button></div>}
    {order && <div className="space-y-5 rounded-2xl border border-[#E2DAC8] bg-white p-5 md:p-7">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Order",order.order_number||order.id],["Placed",order.created_at?new Date(order.created_at).toLocaleString():"Not recorded"],["Status",String(order.status||"unknown").replaceAll("_"," ")],["Payment",String(order.payment_status||"unknown").replaceAll("_"," ")]].map(([label,value])=><div key={label}><p className="text-[11px] text-[#777]">{label}</p><p className="mt-1 text-sm font-semibold capitalize">{value}</p></div>)}</div>
      <div className="grid gap-5 border-t pt-5 md:grid-cols-2"><div><h2 className="mb-2 text-sm font-bold">Customer</h2><p className="text-sm">{order.customer?.full_name||"Customer details unavailable"}</p>{order.customer?.email&&<p className="text-xs text-[#666]">{order.customer.email}</p>}{order.customer?.phone&&<p className="text-xs text-[#666]">{order.customer.phone}</p>}</div><div><h2 className="mb-2 text-sm font-bold">Delivery address</h2><p className="text-sm">{order.shipping_address?.full_name||"Address unavailable"}</p><p className="text-xs text-[#666]">{[order.shipping_address?.line1,order.shipping_address?.line2,order.shipping_address?.city,order.shipping_address?.state,order.shipping_address?.pincode].filter(Boolean).join(", ")||"No saved address on this order"}</p></div></div>
      <div className="border-t pt-5"><h2 className="mb-3 text-sm font-bold">Items</h2>{order.items?.length?<div className="divide-y">{order.items.map((item:any,index:number)=><div key={item.id||item.product_id||index} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.product_name||"Product"}</p><p className="text-xs text-[#666]">Qty {item.quantity} · {item.ready_stock_quantity??item.quantity} ready / {item.preorder_quantity||0} pre-booked · {formatPrice(item.unit_price||0)} each</p>{item.expected_delivery_date&&<p className="text-xs">Expected delivery: {new Date(item.expected_delivery_date).toLocaleDateString("en-IN",{timeZone:"UTC"})}</p>}</div><strong className="shrink-0 text-sm">{formatPrice(item.total_price||0)}</strong></div>)}</div>:<p className="text-xs text-[#777]">This order has no item lines.</p>}</div>
      <div className="ml-auto max-w-sm space-y-2 border-t pt-4 text-sm">{[["Initial payment required",order.amount_due_now??order.total_amount],["20% pre-book advance",order.advance_amount||0],["Balance after initial payment",order.balance_amount||0],["Subtotal",order.subtotal],["Discount",order.discount_amount], ["Shipping",order.shipping_amount]].map(([label,value])=><div key={label} className="flex justify-between"><span className="text-[#666]">{label}</span><span>{formatPrice(Number(value)||0)}</span></div>)}<div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatPrice(order.total_amount||0)}</span></div></div>
    </div>}
    {!loading&&!order&&!error&&<p className="rounded-xl border bg-white p-8 text-center text-sm text-[#666]">Order not found.</p>}
  </section>;
}
