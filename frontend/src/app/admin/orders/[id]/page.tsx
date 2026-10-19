"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer, RefreshCw } from "lucide-react";
import DeliveryManager from "@/components/admin/DeliveryManager";
import { adminApi, orderApi, api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, getApiError } from "@/lib/utils";

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating,setUpdating]=useState(false);
  const [downloading,setDownloading]=useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const { data } = await adminApi.order(params.id); setOrder(data); }
    catch (err) { setError(getApiError(err)); setOrder(null); }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { if (!isAuthenticated || role !== "admin") { router.replace("/auth/login"); return; } void load(); }, [isAuthenticated, role, router, load]);

  const invoice=async()=>{setDownloading(true);try{const {data}=await orderApi.invoice(params.id);const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download='invoice-'+(order?.order_number||params.id)+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(getApiError(e));}finally{setDownloading(false);}};
  const advance=async(action:string)=>{setUpdating(true);setError("");try{if(action==="ready")await api.post(`/orders/${params.id}/ready-for-delivery`);else await api.patch(`/orders/${params.id}/status`,{status:action});await load();}catch(e){setError(getApiError(e));}finally{setUpdating(false);}};
  if (loading) return <div className="flex h-80 items-center justify-center"><Loader2 className="animate-spin"/></div>;
  return <section className="admin-order-detail space-y-5 text-wood-900 font-garamond">
    <header className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><button onClick={() => router.push("/admin/orders")} className="rounded-full border bg-white p-2" aria-label="Back to orders"><ArrowLeft size={16}/></button><div><h1 className="font-cormorant text-3xl font-bold">Order details</h1><p className="text-xs text-[#666]">{order?.order_number || "Order"}</p></div></div><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs"><Printer size={14}/>Print</button><button disabled={downloading} onClick={()=>void invoice()} className="rounded-lg border bg-white px-3 py-2 text-xs disabled:opacity-50">{downloading?"Preparing PDF…":"Download invoice"}</button></header>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button onClick={() => void load()} className="inline-flex items-center gap-1 font-bold underline"><RefreshCw size={13}/>Retry</button></div>}
    {order && <div className="space-y-5 rounded-2xl border border-[#dce5df] bg-white p-5 md:p-7">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><h2 className="font-semibold">Making and delivery</h2><p className="my-2 text-sm">Verify the initial payment, start making the furniture, then mark it ready. The customer is notified and balance payment unlocks. Full payment is required before dispatch.</p><div className="flex flex-wrap gap-2">{order.status==="confirmed"&&<button disabled={updating} onClick={()=>void advance("processing")} className="rounded-lg bg-emerald-900 px-4 py-2 text-sm text-white disabled:opacity-50">Start making / processing</button>}{order.has_preorder&&order.status==="processing"&&!order.balance_released_at&&<button disabled={updating} onClick={()=>void advance("ready")} className="rounded-lg bg-emerald-900 px-4 py-2 text-sm text-white disabled:opacity-50">Made and ready — notify customer</button>}{order.balance_released_at&&<p className="text-sm font-medium text-emerald-900">Customer notified: furniture ready for delivery.</p>}{order.status==="processing"&&order.payment_status==="paid"&&<button disabled={updating} onClick={()=>void advance("shipped")} className="rounded-lg bg-emerald-900 px-4 py-2 text-sm text-white disabled:opacity-50">Mark dispatched</button>}{order.status==="shipped"&&<button disabled={updating} onClick={()=>void advance("out_for_delivery")} className="rounded-lg border px-4 py-2 text-sm">Out for delivery</button>}{order.status==="out_for_delivery"&&<button disabled={updating} onClick={()=>void advance("delivered")} className="rounded-lg border px-4 py-2 text-sm">Mark delivered</button>}</div></section>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Order",order.order_number||order.id],["Placed",order.created_at?new Date(order.created_at).toLocaleString():"Not recorded"],["Status",String(order.status||"unknown").replaceAll("_"," ")],["Payment",String(order.payment_status||"unknown").replaceAll("_"," ")]].map(([label,value])=><div key={label}><p className="text-[11px] text-[#777]">{label}</p><p className="mt-1 text-sm font-semibold capitalize">{value}</p></div>)}</div>
      <div className="grid gap-5 border-t pt-5 md:grid-cols-2"><div><h2 className="mb-2 text-sm font-bold">Customer</h2><p className="text-sm">{order.customer?.full_name||"Customer details unavailable"}</p>{order.customer?.email&&<p className="text-xs text-[#666]">{order.customer.email}</p>}{order.customer?.phone&&<p className="text-xs text-[#666]">{order.customer.phone}</p>}</div><div><h2 className="mb-2 text-sm font-bold">Delivery address</h2><p className="text-sm">{order.shipping_address?.full_name||"Address unavailable"}</p><p className="text-xs text-[#666]">{[order.shipping_address?.line1,order.shipping_address?.line2,order.shipping_address?.city,order.shipping_address?.state,order.shipping_address?.pincode].filter(Boolean).join(", ")||"No saved address on this order"}</p></div></div>
      {order.payment_environment==="sandbox"&&<p className="rounded bg-amber-50 p-3 text-sm">Sandbox test order â€” simulated payment, no real funds.</p>}<div className="border-t pt-5"><h2 className="mb-3 text-sm font-bold">Items</h2>{order.items?.length?<div className="divide-y">{order.items.map((item:any,index:number)=><div key={item.id||item.product_id||index} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.product_name||"Product"}</p><p className="text-xs text-[#666]">Qty {item.quantity} Â· {item.ready_stock_quantity??item.quantity} ready / {item.preorder_quantity||0} pre-booked Â· {formatPrice(item.unit_price||0)} each</p>{item.expected_delivery_date&&<p className="text-xs">Expected delivery: {new Date(item.expected_delivery_date).toLocaleDateString("en-IN",{timeZone:"UTC"})}</p>}</div><strong className="shrink-0 text-sm">{formatPrice(item.total_price||0)}</strong></div>)}</div>:<p className="text-xs text-[#777]">This order has no item lines.</p>}</div>
      <DeliveryManager order={order} onSaved={load}/>
      <div className="admin-order-summary ml-auto max-w-sm space-y-2 border-t pt-4 text-sm">{[["Verified payments",order.paid_amount||0],["Refunded",order.refunded_amount||0],["Outstanding",order.outstanding_amount??order.total_amount],["Initial payment required",order.amount_due_now??order.total_amount],["20% pre-book advance",order.advance_amount||0],["Balance after initial payment",order.balance_amount||0],["Subtotal",order.subtotal],["Discount",order.discount_amount], ["Shipping",order.shipping_amount]].map(([label,value])=><div key={label} className="flex justify-between"><span className="text-[#666]">{label}</span><span>{formatPrice(Number(value)||0)}</span></div>)}<div className="flex justify-between border-t pt-2 font-bold"><span>Total</span><span>{formatPrice(order.total_amount||0)}</span></div></div>
    </div>}
    {!loading&&!order&&!error&&<p className="rounded-xl border bg-white p-8 text-center text-sm text-[#666]">Order not found.</p>}
  </section>;
}
