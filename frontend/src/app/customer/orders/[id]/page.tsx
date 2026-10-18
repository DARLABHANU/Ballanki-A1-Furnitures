"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Loader2, Package, CreditCard, RotateCcw, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { orderApi, paymentApi, openPhonePeCheckout } from "@/lib/api";
import { Order } from "@/types";
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/lib/utils";
import OrderTracker from "@/components/customer/OrderTracker";
import { useAuthStore } from "@/store/authStore";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [paymentConfig,setPaymentConfig]=useState<{enabled:boolean;environment:string}|null>(null);
  const [paymentMessage,setPaymentMessage]=useState("");
  useEffect(()=>{paymentApi.config().then(({data})=>setPaymentConfig(data)).catch(()=>{});},[]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    orderApi.get(id)
      .then((r) => setOrder(r.data))
      .catch(() => router.push("/customer/orders"))
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated]);

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
      const updated=await orderApi.get(id);setOrder(updated.data);
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
  const handlePayNow=async()=>{setIsProcessingPayment(true);try{const {data}=await paymentApi.start(id);openPhonePeCheckout(data.redirect_url);}catch(e:any){toast.error(e.response?.data?.error||"Could not start payment. Check its status and retry.");}finally{setIsProcessingPayment(false);}};

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#0D0D0D]" size={32} />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-garamond">
      <div className="mx-auto max-w-6xl px-4 pt-4 text-sm space-y-2">{(order.payment_environment==="sandbox"||paymentConfig?.environment==="sandbox")&&<p className="rounded-lg bg-amber-50 p-3">PhonePe sandbox test payment — no real funds collected.</p>}{paymentMessage&&<p role="status" className="rounded-lg border p-3">{paymentMessage}</p>}<p>Verified paid: {formatPrice(order.paid_amount||0)} · Outstanding: {formatPrice(order.outstanding_amount??Math.max(0,order.total_amount-(order.paid_amount||0)))}</p>{order.payment_method==="phonepe"&&<button disabled={isProcessingPayment} onClick={refreshPayment} className="underline disabled:opacity-50">Check payment status</button>}</div>
      {/* ── Mobile Header ── */}
      <div className="md:hidden sticky top-0 z-40 bg-white border-b border-[#E2DAC8] shadow-xs">
        <div className="flex items-center justify-between px-4 py-3.5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#EFEBE3] transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft size={22} className="text-[#1A1A1A]" />
          </button>
          <h1 className="font-cormorant text-[20px] font-bold tracking-wide text-[#1A1A1A]">
            Order Details
          </h1>
          <div className="w-9 h-9 flex items-center justify-center text-xs font-bold text-[#0D0D0D]">
            #{order.order_number.slice(-4)}
          </div>
        </div>
      </div>

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-6 pb-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#0D0D0D] hover:underline mb-3"
        >
          <ChevronLeft size={16} /> Back to My Orders
        </button>
        <div className="flex justify-between items-start border-b border-[#EFEBE3] pb-3 mb-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-[#0D0D0D] bg-[#EFEBE3] border border-[#E2DAC8] px-2.5 py-1 rounded-md uppercase inline-block mb-1">
              ORDER SUMMARY
            </span>
            <h1 className="font-cormorant text-3xl font-bold text-[#1A1A1A]">Order #{order.order_number}</h1>
            <p className="text-xs text-[#808080] mt-0.5">Placed on {formatDate(order.created_at)}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-md uppercase ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6">

        {/* Order Tracker Card */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
          <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2 flex items-center gap-2">
            <Package size={18} className="text-[#0D0D0D]" /> Order Tracking
          </h2>
          <OrderTracker status={order.status} history={order.status_history} />
        </div>

        {/* Items & Payment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Items List Card */}
          <div className="bg-white border border-[#E2DAC8] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2">
              Items Ordered ({order.items.length})
            </h2>
            <div className="space-y-3 divide-y divide-[#F2EFE9]">
              {order.amount_due_now!==undefined&&<div className="mb-4 rounded-xl bg-amber-50 p-4 text-sm space-y-2"><p>Initial payment required: {formatPrice(order.amount_due_now)} · Payment status: {order.payment_status}</p>{order.has_preorder&&<><p>20% pre-book advance: {formatPrice(order.advance_amount||0)}</p><p>Balance after initial payment: {formatPrice(order.balance_amount||0)}</p></>}<p>{order.payment_environment==="sandbox"?"Sandbox payments are simulated; no real money is collected.":paymentConfig?.enabled?"Payments are confirmed only after server verification with PhonePe.":"Online payments are currently unavailable."}</p>{order.items.map(i=><p key={i.id}>{i.product_name}: {i.ready_stock_quantity??i.quantity} ready · {i.preorder_quantity||0} pre-booked{i.expected_delivery_date?` · Admin expected delivery: ${new Date(i.expected_delivery_date).toLocaleDateString('en-IN',{timeZone:'UTC'})}`:' · Delivery date awaiting admin confirmation'}</p>)}</div>}
              {order.items.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-[#E2DAC8] flex-shrink-0">
                    {item.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#808080]">
                        <Package size={18} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-garamond text-sm font-bold text-[#1A1A1A] truncate">{item.product_name}</p>
                    <p className="text-xs text-[#808080]">Qty: {item.quantity}</p>
                    <p className="font-garamond text-xs font-bold text-[#0D0D0D] mt-0.5">{formatPrice(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Shipping Summary */}
          <div className="bg-white border border-[#E2DAC8] rounded-3xl p-5 md:p-6 shadow-xs space-y-4">
            <h2 className="font-cormorant text-xl font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-2 flex items-center gap-2">
              <CreditCard size={18} className="text-[#0D0D0D]" /> Payment Breakdown
            </h2>

            <div className="space-y-2 text-xs text-[#666666]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#1A1A1A]">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Discount</span>
                  <span className="font-bold">-{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Transit</span>
                <span className="font-bold text-[#1A1A1A]">{order.shipping_amount === 0 ? "FREE" : formatPrice(order.shipping_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span className="font-bold text-[#1A1A1A]">{formatPrice(order.tax_amount)}</span>
              </div>

              <div className="flex justify-between text-base font-bold text-[#1A1A1A] border-t border-[#EFEBE3] pt-3">
                <span>Total Amount</span>
                <span className="font-cormorant text-xl font-extrabold text-[#0D0D0D]">{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#EFEBE3] space-y-2">
              {paymentConfig?.enabled && order.payment_status !== "paid" && !["cancelled","refunded"].includes(order.status) && (
                <button
                  onClick={handlePayNow}
                  disabled={isProcessingPayment}
                  className="w-full bg-[#0D0D0D] text-white py-3 rounded-xl font-bold text-xs shadow-xs"
                >
                  {isProcessingPayment ? "Processing..." : (order.payment_status === "partially_paid"?"PAY REMAINING BALANCE VIA PHONEPE":"PAY VIA PHONEPE")}
                </button>
              )}

              {order.status === "pending" && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>{isCancelling ? "Cancelling..." : "Cancel Order"}</span>
                </button>
              )}

              {order.status === "delivered" && (
                <button
                  onClick={handleRefundOrder}
                  disabled={isRefunding}
                  className="w-full border border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#EFEBE3] py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>{isRefunding ? "Submitting..." : "Request Return / Refund (7 Days)"}</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
