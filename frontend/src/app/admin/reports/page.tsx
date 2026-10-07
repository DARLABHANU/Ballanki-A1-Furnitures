"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { getApiError, formatPrice } from "@/lib/utils";
import type { AdminDashboard } from "@/types";

export default function ReportsAnalyticsPage() {
  const { isAuthenticated, role } = useAuthStore();
  const [range, setRange] = useState<AdminDashboard["range"]>("month");
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const response = await adminApi.dashboard(range); setData(response.data); }
    catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { if (isAuthenticated && role === "admin") void load(); }, [isAuthenticated, role, load]);

  if (loading && !data) return <div className="flex h-80 items-center justify-center"><Loader2 className="animate-spin"/></div>;
  return <section className="space-y-6 text-wood-900 font-garamond">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-cormorant text-3xl font-bold">Reports &amp; Analytics</h1><p className="text-xs text-[#666]">Sales and order data from recorded store activity.</p></div><div className="flex gap-2"><select aria-label="Report period" value={range} onChange={event => setRange(event.target.value as AdminDashboard["range"])} className="rounded-lg border border-[#E2DAC8] bg-white px-3 py-2 text-xs"><option value="month">This month</option><option value="last_month">Last month</option><option value="year">This year</option></select><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-[#E2DAC8] bg-white px-3 py-2 text-xs"><RefreshCw size={14}/>Refresh</button></div></header>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="flex items-center gap-2"><AlertCircle size={16}/>{error}</span><button onClick={() => void load()} className="font-bold underline">Retry</button></div>}
    <div className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border bg-white p-5"><p className="text-xs text-[#666]">Paid revenue</p><strong className="mt-2 block font-cormorant text-2xl">{formatPrice(data?.total_revenue || 0)}</strong><span className="text-[11px] text-[#777]">{data?.paid_orders || 0} paid orders, all time</span></article><article className="rounded-2xl border bg-white p-5"><p className="text-xs text-[#666]">Orders</p><strong className="mt-2 block font-cormorant text-2xl">{data?.total_orders || 0}</strong><span className="text-[11px] text-[#777]">All recorded orders</span></article><article className="rounded-2xl border bg-white p-5"><p className="text-xs text-[#666]">Paid sales in selected period</p><strong className="mt-2 block font-cormorant text-2xl">{formatPrice(data?.sales_points.reduce((sum, point) => sum + point.revenue, 0) || 0)}</strong><span className="text-[11px] text-[#777]">{range === "month" ? "This month" : range === "last_month" ? "Last month" : "This year"}</span></article></div>
    <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border bg-white p-5"><h2 className="mb-3 border-b pb-3 text-sm font-bold">Paid sales by period</h2>{loading ? <Loader2 className="mx-auto my-10 animate-spin"/> : data?.sales_points.some(point => point.revenue > 0) ? <div className="max-h-96 space-y-2 overflow-y-auto">{data.sales_points.filter(point => point.revenue > 0).map(point => <div key={point.key} className="flex justify-between border-b py-2 text-xs"><span>{point.key}</span><strong>{formatPrice(point.revenue)}</strong></div>)}</div> : <p className="py-10 text-center text-xs text-[#777]">No paid sales recorded in this period.</p>}</section><section className="rounded-2xl border bg-white p-5"><div className="mb-3 flex items-center justify-between border-b pb-3"><h2 className="text-sm font-bold">Top products by orders</h2><Link href="/admin/products" className="text-xs font-semibold text-green-800">Manage products</Link></div>{data?.top_products.length ? <div className="space-y-2">{data.top_products.map((product,index) => <div key={product.product_id || `${product.name}-${index}`} className="flex items-center justify-between gap-3 border-b py-2 text-xs"><span className="min-w-0 truncate">{product.name} · {product.quantity} ordered</span><strong>{formatPrice(product.order_value)}</strong></div>)}</div> : <p className="py-10 text-center text-xs text-[#777]">No product orders recorded in this period.</p>}</section></div>
  </section>;
}
