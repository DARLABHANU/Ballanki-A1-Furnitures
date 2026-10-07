"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BarChart3, CircleDollarSign, Loader2, Megaphone, Package, RefreshCw, ShoppingBag, ShoppingCart, Tag, Users } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { AdminDashboard } from "@/types";
import { formatPrice } from "@/lib/utils";

const statusColor: Record<string, string> = {
  pending: "#E07830", confirmed: "#1565C0", processing: "#FB8C00", shipped: "#1E88E5",
  out_for_delivery: "#7B1FA2", delivered: "#2E7D32", cancelled: "#8E24AA", refunded: "#546E7A",
};
const statusName = (status: string) => status.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [timeRange, setTimeRange] = useState<"month" | "last_month" | "year">("month");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") {
      router.push("/auth/login");
      return;
    }
    let active = true;
    setIsLoading(true);
    setLoadError("");
    adminApi.dashboard(timeRange)
      .then(({ data: dashboard }) => { if (active) setData(dashboard); })
      .catch(() => { if (active) setLoadError("Dashboard data could not be loaded. Check the backend connection and retry."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [isAuthenticated, role, router, timeRange, reloadKey]);

  const sales = data?.sales_points || [];
  const chart = useMemo(() => {
    if (!sales.length) return { line: "", area: "", labels: [] as Array<{x:number;label:string}> };
    const max = Math.max(1, ...sales.map(point => point.revenue));
    const coords = sales.map((point, index) => ({
      x: sales.length === 1 ? 210 : 30 + index * 360 / (sales.length - 1),
      y: 140 - point.revenue / max * 112,
    }));
    const line = coords.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
    const area = `${line} L ${coords[coords.length-1].x.toFixed(1)},145 L ${coords[0].x.toFixed(1)},145 Z`;
    const stride = Math.max(1, Math.ceil(sales.length / 6));
    const labels = sales.map((point,index)=>({x:coords[index].x,label:point.label})).filter((_,index)=>index%stride===0||index===sales.length-1);
    return { line, area, labels };
  }, [sales]);

  const statusSegments = useMemo(() => {
    const rows = data?.order_statuses || [];
    const total = rows.reduce((sum,row)=>sum+row.count,0);
    if (!total) return "#EAE6DF 0% 100%";
    let cursor = 0;
    return rows.map(row => {
      const start=cursor;cursor+=row.count/total*100;
      return `${statusColor[row.status]||"#78909C"} ${start}% ${cursor}%`;
    }).join(", ");
  }, [data?.order_statuses]);

  if (isLoading && !data) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-wood-900" size={36}/></div>;

  const cards = [
    {label:"Paid Revenue",value:formatPrice(data?.total_revenue||0),detail:`${(data?.paid_orders||0).toLocaleString()} paid orders`,icon:CircleDollarSign,color:"text-green-700 bg-green-50"},
    {label:"Total Orders",value:(data?.total_orders||0).toLocaleString(),detail:`${(data?.pending_orders||0).toLocaleString()} pending`,icon:ShoppingCart,color:"text-blue-700 bg-blue-50"},
    {label:"Total Users",value:(data?.total_users||0).toLocaleString(),detail:`${(data?.total_customers||0).toLocaleString()} customers`,icon:Users,color:"text-purple-700 bg-purple-50"},
    {label:"Live Products",value:(data?.total_products||0).toLocaleString(),detail:"Published products in the customer catalog",icon:Package,color:"text-orange-700 bg-orange-50"},
    {label:"Promoters",value:(data?.total_promoters||0).toLocaleString(),detail:"Active promoter accounts",icon:Megaphone,color:"text-red-700 bg-red-50"},
  ];

  return <div className="space-y-6 text-wood-900 font-garamond">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-cormorant text-3xl font-bold">Admin Dashboard</h1><p className="text-xs text-[#666]">Live summary from your store database.</p></div>
      <button onClick={()=>{setIsLoading(true);setReloadKey(key=>key+1);}} className="inline-flex items-center gap-2 rounded-lg border border-[#E2DAC8] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#F8F5F0]"><RefreshCw size={14}/>Refresh</button>
    </div>
    {loadError&&<div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="flex items-center gap-2"><AlertCircle size={17}/>{loadError}</span><button className="font-bold underline" onClick={()=>{setIsLoading(true);setReloadKey(key=>key+1);}}>Retry</button></div>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(card=><div key={card.label} className="rounded-2xl border border-[#E2DAC8] bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#666]">{card.label}</span><span className={`grid h-8 w-8 place-items-center rounded-xl ${card.color}`}><card.icon size={16}/></span></div><div className="mt-2"><h2 className="font-cormorant text-2xl font-bold">{card.value}</h2><p className="text-[10px] text-[#808080]">{card.detail}</p></div></div>)}
    </div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <section className="space-y-4 rounded-2xl border border-[#E2DAC8] bg-white p-5 lg:col-span-6">
        <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-3"><div><h2 className="text-sm font-bold">Paid Sales</h2><p className="text-[10px] text-[#808080]">Revenue from completed payments only</p></div><select aria-label="Sales period" value={timeRange} onChange={event=>setTimeRange(event.target.value as typeof timeRange)} className="rounded-lg border border-[#E2DAC8] bg-[#F8F5F0] px-2 py-1 text-xs"><option value="month">This Month</option><option value="last_month">Last Month</option><option value="year">This Year</option></select></div>
        <div className="relative h-48 w-full"><svg role="img" aria-label="Paid sales chart" className="h-full w-full" viewBox="0 0 400 160" preserveAspectRatio="none"><defs><linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2E7D32" stopOpacity=".22"/><stop offset="100%" stopColor="#2E7D32" stopOpacity="0"/></linearGradient></defs>{[20,50,80,110,140].map(y=><line key={y} x1="30" y1={y} x2="390" y2={y} stroke="#EFEBE3" strokeDasharray="3 3"/>)}{chart.area&&<path d={chart.area} fill="url(#salesGrad)"/>}{chart.line&&<path d={chart.line} fill="none" stroke="#1B4D3E" strokeWidth="2.5" vectorEffect="non-scaling-stroke"/>}{sales.length>0&&sales.some(point=>point.revenue>0)&&chart.line&&<circle cx={chart.line.split(" ").slice(-1)[0]?.split(",")[0]} cy={chart.line.split(" ").slice(-1)[0]?.split(",")[1]} r="4" fill="#1B4D3E"/>}</svg></div>
        <div className="flex justify-between gap-2 px-3 text-[10px] text-[#808080]">{chart.labels.map((label,index)=><span key={`${label.label}-${index}`}>{label.label}</span>)}</div>
        {sales.every(point=>point.revenue===0)&&<p className="text-center text-xs text-[#808080]">No paid sales in this period yet.</p>}
      </section>
      <section className="space-y-4 rounded-2xl border border-[#E2DAC8] bg-white p-5 lg:col-span-3">
        <h2 className="border-b border-[#EFEBE3] pb-3 text-sm font-bold">Order Status</h2>
        <div className="flex items-center gap-4"><div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{background:`conic-gradient(${statusSegments})`}}><div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><div><strong className="block text-lg">{(data?.total_orders||0).toLocaleString()}</strong><span className="text-[9px] text-[#666]">Orders</span></div></div></div>
          <div className="min-w-0 flex-1 space-y-1.5">{(data?.order_statuses||[]).length?data!.order_statuses.map(row=><div key={row.status} className="flex items-center justify-between gap-2 text-[10px]"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:statusColor[row.status]||"#78909C"}}/>{statusName(row.status)}</span><strong>{row.count}</strong></div>):<p className="text-xs text-[#808080]">No orders yet.</p>}</div>
        </div>
        <p className="text-[10px] text-[#808080]">Counts include all recorded orders.</p>
      </section>
      <section className="space-y-3 rounded-2xl border border-[#E2DAC8] bg-white p-5 lg:col-span-3"><div className="flex items-center justify-between border-b border-[#EFEBE3] pb-3"><h2 className="text-sm font-bold">Top Products</h2><Link href="/admin/products" className="text-xs font-semibold text-green-800 hover:underline">Products</Link></div>
        {(data?.top_products||[]).length?data!.top_products.map((product,index)=><div key={product.product_id||`${product.name}-${index}`} className="flex items-center justify-between gap-2 border-b border-[#F3F0EA] py-2 last:border-0"><div className="min-w-0"><p className="truncate text-xs font-semibold">{product.name}</p><p className="text-[10px] text-[#808080]">{product.quantity} items ordered · order value</p></div><span className="shrink-0 text-[10px] font-semibold">{formatPrice(product.order_value||0)}</span></div>):<p className="py-6 text-center text-xs text-[#808080]">No product orders in this period.</p>}
      </section>
    </div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <section className="rounded-2xl border border-[#E2DAC8] bg-white p-5 lg:col-span-7"><div className="mb-3 flex items-center justify-between border-b border-[#EFEBE3] pb-3"><h2 className="text-sm font-bold">Recent Orders</h2><Link href="/admin/orders" className="text-xs font-semibold text-green-800 hover:underline">View all</Link></div>
        <div className="space-y-2">{data?.recent_orders?.length?data.recent_orders.slice(0,5).map(order=><Link href={`/admin/orders/${order.id}`} key={order.id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-[#F8F5F0]"><div className="min-w-0"><p className="truncate text-xs font-semibold">{order.order_number||`Order ${order.id}`}</p><p className="truncate text-[10px] text-[#808080]">{order.customer?.full_name||"Customer"} · {order.payment_status||"pending payment"}</p></div><div className="shrink-0 text-right"><p className="text-xs font-bold">{formatPrice(order.total_amount||0)}</p><span className="text-[10px] capitalize text-[#666]">{statusName(order.status)}</span></div></Link>):<p className="py-6 text-center text-xs text-[#808080]">No recent orders.</p>}</div>
      </section>
      <section className="rounded-2xl border border-[#E2DAC8] bg-white p-5 lg:col-span-5"><h2 className="mb-3 border-b border-[#EFEBE3] pb-3 text-sm font-bold">Store Overview</h2><div className="space-y-2 text-xs">{[["Paid revenue",formatPrice(data?.total_revenue||0)],["All orders",(data?.total_orders||0).toLocaleString()],["Pending orders",(data?.pending_orders||0).toLocaleString()],["Active coupons",(data?.active_coupons||0).toLocaleString()],["Customers",(data?.total_customers||0).toLocaleString()],["Live products",(data?.total_products||0).toLocaleString()]].map(([label,value])=><div key={label} className="flex justify-between border-b border-[#EFEBE3] py-2 last:border-0"><span className="text-[#666]">{label}</span><strong>{value}</strong></div>)}</div></section>
    </div>
    <div className="rounded-2xl border border-[#E2DAC8] bg-white p-4"><div className="mb-3 flex items-center gap-2 text-sm font-bold"><BarChart3 size={16}/>Admin shortcuts</div><div className="flex flex-wrap gap-2">{[["Users","/admin/users",Users],["Products","/admin/products",Package],["Orders","/admin/orders",ShoppingBag],["Coupons","/admin/coupons",Tag],["Reports","/admin/reports",BarChart3]].map(([label,href,Icon]:any)=><Link key={href} href={href} className="inline-flex items-center gap-1.5 rounded-full border border-wood-200 bg-wood-50 px-3 py-1.5 text-xs hover:bg-wood-100"><Icon size={13}/>{label}</Link>)}</div></div>
  </div>;
}
