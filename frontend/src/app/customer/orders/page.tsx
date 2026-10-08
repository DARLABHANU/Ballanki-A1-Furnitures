"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, ChevronRight, Loader2, ShoppingBag, CheckCircle2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { orderApi } from "@/lib/api";

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Deposit",
  processing: "In Production",
  shipped: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-wood-800 text-wood-50",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_FILTERS = [
  { value: "", label: "All Reservations" },
  { value: "pending", label: "Awaiting Deposit" },
  { value: "processing", label: "In Production" },
  { value: "shipped", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
];

function OrdersContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setShowSuccess(false);

    setIsLoading(true);
    orderApi.list({ status: statusFilter || undefined })
      .then((res: any) => {
        const orders = res.data.items || res.data.orders || res.data || [];
        setData(orders);
      })
      .catch((err: any) => {
        console.error("Failed to load orders:", err);
        setData([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [statusFilter, searchParams]);

  return (
    <div className="space-y-6 text-wood-900 font-inter bg-wood-50 min-h-[85vh]">

      {showSuccess && (
        <div className="max-w-4xl mx-auto px-6 pt-6">
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-800">
            <CheckCircle2 size={24} className="shrink-0" />
            <div>
              <p className="font-bold text-sm uppercase tracking-wider">Reservation Confirmed</p>
              <p className="text-xs font-medium mt-0.5">Your order has been saved. Payment is pending; no deposit has been collected.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Desktop Header ── */}
      <div className="hidden md:block max-w-4xl mx-auto px-6 pt-6 pb-2">
        <span className="text-[10px] font-bold tracking-widest text-wood-500 bg-white border border-wood-200 px-2.5 py-1 rounded-md uppercase inline-block mb-2">
          CLIENT PORTAL
        </span>
        <h1 className="font-playfair text-3xl font-bold text-wood-900">Reservations & History</h1>
        <p className="text-sm text-wood-500 mt-1">Track the production and delivery status of your bespoke furniture.</p>
      </div>

      {/* ── Content Area ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex gap-2 min-w-0 max-w-full overflow-x-auto pb-2 mb-6 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 font-inter text-xs font-bold px-4 py-2.5 rounded-lg transition-all border whitespace-nowrap uppercase tracking-wider ${statusFilter === f.value
                ? "bg-wood-900 text-white border-wood-900 shadow-sm"
                : "bg-white text-wood-600 border-wood-200 hover:border-wood-900 hover:text-wood-900"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-52">
            <Loader2 className="animate-spin text-wood-900" size={32} />
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white border border-wood-200 rounded-2xl p-12 text-center shadow-sm space-y-4 max-w-lg mx-auto my-8">
            <div className="w-20 h-20 bg-wood-50 rounded-full flex items-center justify-center mx-auto text-wood-400">
              <Package size={32} />
            </div>
            <h2 className="font-playfair text-2xl font-bold text-wood-900">No Reservations Found</h2>
            <p className="text-sm text-wood-500">
              {statusFilter ? "No orders currently match this status." : "You haven't commissioned any pieces yet."}
            </p>
            <Link
              href="/customer/products"
              className="inline-flex items-center justify-center gap-2 bg-wood-900 hover:bg-wood-950 text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
            >
              <ShoppingBag size={15} />
              <span>Explore Collections</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-wood-200 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:border-wood-900 hover:shadow-md transition-all group block"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-inter text-sm font-bold text-wood-900">
                      {order.order_number}
                    </span>
                    <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-wood-500 font-medium tracking-wide">
                    {order.items.length} item{order.items.length !== 1 ? "s" : ""} · Recorded {formatDate(order.created_at)}
                  </p>
                  <p className="text-sm font-semibold text-wood-900 truncate">
                    {order.items.map((i: any) => i.product_name).join(", ")}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-4 sm:pt-0 border-t sm:border-t-0 border-wood-100">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-wood-400 uppercase tracking-wider mb-0.5">Total Value</p>
                    <span className="font-playfair text-xl font-bold text-wood-900">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-wood-50 flex items-center justify-center text-wood-500 group-hover:bg-wood-900 group-hover:text-white transition-colors cursor-pointer shadow-sm">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-wood-900" size={28} /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
