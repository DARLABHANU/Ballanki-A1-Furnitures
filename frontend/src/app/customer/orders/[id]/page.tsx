"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ReturnStatus from "@/components/customer/ReturnStatus";
import PaymentShell from "@/components/checkout/PaymentShell";
import { CheckCircle2, Clock3, Download, MapPin, ArrowUpRight, Loader2, Package, CreditCard, RotateCcw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi, paymentApi } from "@/lib/api";
import { Order } from "@/types";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import OrderTracker from "@/components/customer/OrderTracker";
import { useAuthStore } from "@/store/authStore";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user, isLoading: authLoading } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [paymentConfig,setPaymentConfig]=useState<{enabled:boolean;environment:string}|null>(null);
  const [paymentMessage,setPaymentMessage]=useState("");
  const [downloading,setDownloading]=useState(false);
  const downloadInvoice=async()=>{setDownloading(true);try{const {data}=await orderApi.invoice(id);const url=URL.createObjectURL(data);const link=document.createElement("a");link.href=url;link.download=`invoice-${order?.order_number||id}.pdf`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{toast.error("Invoice could not be downloaded. Please retry.");}finally{setDownloading(false);}};
  useEffect(()=>{paymentApi.config().then(({data})=>setPaymentConfig(data)).catch(()=>{});},[]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    orderApi.get(id)
      .then((r) => setOrder(r.data))
      .catch(() => router.push("/customer/orders"))
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated, authLoading, router]);

  useEffect(()=>{if(!isAuthenticated)return;let live=true;const refresh=()=>orderApi.get(id).then(({data})=>{if(live)setOrder(data);}).catch(()=>{});const timer=window.setInterval(()=>{if(!document.hidden)void refresh();},15000);window.addEventListener("focus",refresh);return()=>{live=false;window.clearInterval(timer);window.removeEventListener("focus",refresh);};},[id,isAuthenticated]);
  const handleRefundOrder = async () => {
    const reason = window.prompt("Please enter a reason for the return request:");
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    setIsRefunding(true);
    try {
      const { data } = await orderApi.refund(id, { reason });
      // The return endpoint returns a request, not the order.
      const updated=await orderApi.get(id);setOrder(updated.data);window.dispatchEvent(new Event("ballanki-returns"));
      toast.success("RMA return request submitted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to request return.");
    } finally {
      setIsRefunding(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setIsCancelling(true);
    try {
      const { data: updatedOrder } = await orderApi.cancel(id);
      setOrder(updatedOrder);
      toast.success("Order cancelled successfully.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to cancel order.");
    } finally {
      setIsCancelling(false);
    }
  };

  const refreshPayment = async()=>{setIsProcessingPayment(true);try{const {data}=await paymentApi.status(id);setOrder(data);setPaymentMessage(data.payment_status==="paid"?"Payment verified. Order fully paid.":data.payment_status==="partially_paid"?"Advance verified. The remaining balance is shown below.":"Payment is not confirmed yet. Check again if you have just paid.");}catch(e:any){setPaymentMessage(e.response?.data?.error||"Could not verify payment. Please retry.");}finally{setIsProcessingPayment(false);}};
  useEffect(()=>{if(!isAuthenticated||!order?.payment_active_id)return;let stopped=false;const check=()=>paymentApi.status(id).then(({data})=>{if(!stopped){setOrder(data);setPaymentMessage(data.payment_status==="paid"?"Payment verified.":data.payment_status==="partially_paid"?"Advance payment verified.":"Payment pending. You can check its status below.");}}).catch(()=>{if(!stopped)setPaymentMessage("Verification is temporarily unavailable. Check payment status again.");});void check();const timer=window.setInterval(()=>{if(!document.hidden)void check();},10000);return()=>{stopped=true;window.clearInterval(timer);};},[id,isAuthenticated,order?.payment_active_id]);
  const handlePayNow=async()=>{setIsProcessingPayment(true);try{const result=await openRazorpayCheckout(id,{name:user?.full_name,email:user?.email,contact:user?.phone||undefined});if(result.order)setOrder(result.order);else {const {data}=await paymentApi.status(id);setOrder(data);}setPaymentMessage(result.dismissed?"Checkout closed. You can resume payment here.":"Payment response verified. Captured amounts are shown below.");}catch(e:any){toast.error(e.response?.data?.error||"Could not start payment. Check its status and retry.");}finally{setIsProcessingPayment(false);}};


  if (isLoading || authLoading) return <PaymentShell back="/customer/orders" backLabel="All orders"><p role="status" className="py-24 text-center">Loading order details…</p></PaymentShell>;
  if (!order) return null;
  const paid=order.paid_amount||0;
  const outstanding=order.outstanding_amount??Math.max(0,order.total_amount-paid);
  const received=paid>0;
  const closed=['cancelled','refunded'].includes(order.status);
  const initial=order.amount_due_now??order.total_amount;
  const balanceLocked=!!order.has_preorder&&paid>=initial&&outstanding>0&&!order.balance_released_at;
  const due=balanceLocked?0:Math.min(outstanding,paid<initial?initial-paid:outstanding);
  const a=order.shipping_address;
  const heading=closed?`Order ${order.status}`:order.payment_status==='paid'?'Payment received. Thank you!':received?'Your advance is confirmed.':'Your order is saved.';
  return <PaymentShell back="/customer/orders" backLabel="All orders"><section className={`mb-6 rounded-2xl border p-5 sm:p-8 ${received&&!closed?'border-emerald-200 bg-[#eaf4ed]':'border-slate-200 bg-white'}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${received&&!closed?'bg-emerald-800 text-white':'bg-amber-50 text-amber-700'}`}>{received&&!closed?<CheckCircle2 size={25}/>:<Clock3 size={25}/>}</div><p className="mb-2 text-xs font-semibold uppercase tracking-[.17em] text-slate-500">Order {order.order_number}</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{heading}</h1><p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">{closed?'Your current order and payment details are shown below.':order.payment_status==='paid'?'You can track preparation and delivery here. Keep your invoice for your records.':received?'Your advance is verified. The store will notify you when your furniture is made and ready. You can then pay the balance here before delivery.':'Payment has not been confirmed. Complete payment below, or check its status if you have already paid.'}</p><p className="mt-3 text-xs text-slate-500">Placed {formatDate(order.created_at)}</p></div><button onClick={downloadInvoice} disabled={downloading} className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"><Download size={17}/>{downloading?'Preparing PDF…':'Download invoice'}</button></div></section>
 {(order.payment_environment==='sandbox'||(!received&&paymentConfig?.enabled&&paymentConfig.environment==='sandbox'))&&<p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Test order · No real funds collected. This invoice is for testing.</p>}{paymentMessage&&<p role="status" className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{paymentMessage}</p>}
 <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5"><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Order progress</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize">{ORDER_STATUS_LABELS[order.status]||order.status}</span></div><OrderTracker status={order.status} history={order.status_history}/>{order.tracking_number&&<p className="mt-4 break-all text-sm">Tracking: {order.tracking_number}</p>}{order.carrier_name&&<p className="mt-2 text-sm">Delivery by: {order.carrier_name}</p>}{order.tracking_url&&/^https:\/\//.test(order.tracking_url)&&<a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline">Track with delivery partner ↗</a>}{order.notes&&<p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{order.notes}</p>}{order.current_location&&<p className="mt-2 text-sm text-slate-500">Current location: {order.current_location}</p>}</section>
 <ReturnStatus orderId={id}/><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="mb-5 text-lg font-semibold">Your furniture</h2><div className="divide-y divide-slate-100">{order.items.map((item,index)=><div key={String(item.id||index)} className="flex gap-4 py-4 first:pt-0 last:pb-0">{item.product_image?<img src={item.product_image} alt="" className="h-20 w-20 shrink-0 rounded-xl bg-slate-50 object-contain"/>:<div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50"><Package className="text-slate-300"/></div>}<div className="min-w-0 flex-1"><h3 className="break-words text-sm font-semibold">{item.product_name}</h3><p className="mt-1 text-xs text-slate-500">Qty {item.quantity} × {formatPrice(item.unit_price)}</p>{!!item.preorder_quantity&&<p className="mt-2 text-xs font-medium text-emerald-800">{item.preorder_quantity} pre-booked · {item.ready_stock_quantity||0} from ready stock</p>}<p className="mt-2 text-xs leading-5 text-slate-500">{item.expected_delivery_date?`Expected delivery: ${formatDate(item.expected_delivery_date)}`:'Expected delivery: awaiting store confirmation'}</p><p className="mt-2 text-sm font-semibold">{formatPrice(item.total_price)}</p></div></div>)}</div></section>
 {a&&<section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><MapPin size={19} className="text-emerald-700"/>Delivery address</h2><address className="break-words text-sm not-italic leading-6 text-slate-600"><strong className="text-slate-800">{a.full_name}</strong><br/>{a.line1}{a.line2&&<>, {a.line2}</>}<br/>{a.city}, {a.state} {a.pincode}<br/>{a.phone}</address></section>}</div>
 <aside className="space-y-5 lg:sticky lg:top-6"><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="mb-5 text-lg font-semibold">Payment summary</h2><dl className="space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>{!!order.discount_amount&&<div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>−{formatPrice(order.discount_amount)}</dd></div>}<div className="flex justify-between"><dt className="text-slate-500">Delivery</dt><dd>{formatPrice(order.shipping_amount)}</dd></div>{!!order.tax_amount&&<div className="flex justify-between"><dt>Tax</dt><dd>{formatPrice(order.tax_amount)}</dd></div>}<div className="flex justify-between border-t border-slate-100 pt-3 font-semibold"><dt>Order total</dt><dd>{formatPrice(order.total_amount)}</dd></div><div className="flex justify-between text-emerald-700"><dt>Verified paid</dt><dd>{formatPrice(paid)}</dd></div>{!!order.refunded_amount&&<div className="flex justify-between text-emerald-700"><dt>Refunded</dt><dd>{formatPrice(order.refunded_amount)}</dd></div>}<div className="flex justify-between"><dt className="text-slate-500">Outstanding</dt><dd>{formatPrice(outstanding)}</dd></div></dl>
 <div className="mt-5 rounded-xl bg-[#edf4ef] p-4"><p className="text-xs font-medium uppercase tracking-wide text-emerald-800">{closed?'Payment status':balanceLocked?'Balance locked until furniture is ready':due>0?'Amount to pay':'Payment complete'}</p><p className="mt-1 text-2xl font-bold text-[#214f40]">{closed?order.payment_status.replaceAll('_',' '):formatPrice(balanceLocked?outstanding:due)}</p>{!received&&order.has_preorder&&<p className="mt-2 text-xs leading-5 text-slate-600">Includes the pre-booking advance and charges due now. Remaining after this payment: {formatPrice(Math.max(0,outstanding-due))}.</p>}</div>
 {balanceLocked&&<p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">Advance paid: {formatPrice(paid)}. Remaining: {formatPrice(outstanding)}. Payment is locked while your furniture is being made. We will notify you when the owner marks it ready for delivery.</p>}
 {order.balance_released_at&&!closed&&outstanding>0&&<p className="mt-4 text-sm font-semibold text-emerald-800">Your furniture is ready for delivery. Pay the balance below so the store can dispatch it.</p>}
 {!closed&&due>0&&<>{paymentConfig?.enabled?<button onClick={handlePayNow} disabled={isProcessingPayment} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#214f40] px-4 py-4 text-sm font-semibold text-white disabled:opacity-50"><CreditCard size={17}/>{isProcessingPayment?'Checking payment…':received?'Pay remaining balance':'Complete payment'}</button>:<p className="mt-4 text-sm text-amber-800">Online payment is currently unavailable. Contact the store for assistance.</p>}{order.payment_method==='razorpay'&&<button onClick={refreshPayment} disabled={isProcessingPayment} className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm font-medium disabled:opacity-50">Check payment status</button>}</>}
 <p className="mt-4 text-xs leading-5 text-slate-500">Only captured, verified payments appear as paid. If money was debited, check payment status before trying again.</p></section>
 <section className="rounded-2xl border border-slate-200 bg-white p-5"><a href="/customer/support" className="flex items-center justify-between text-sm font-semibold">Need help with this order?<ArrowUpRight size={17}/></a><p className="mt-2 text-xs leading-5 text-slate-500">Share order number {order.order_number} with the store.</p>{order.status==='pending'&&!received&&!order.payment_active_id&&<button onClick={handleCancelOrder} disabled={isCancelling} className="mt-4 text-sm text-red-700 disabled:opacity-50">{isCancelling?'Cancelling…':'Cancel unpaid order'}</button>}{order.status==='delivered'&&<button onClick={handleRefundOrder} disabled={isRefunding} className="mt-4 text-sm font-medium text-emerald-800 disabled:opacity-50">{isRefunding?'Submitting…':'Request a return'}</button>}</section><a href="/customer/products" className="block py-2 text-center text-sm font-semibold text-emerald-800">Continue shopping →</a></aside></div></PaymentShell>;
}

