"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";

export default function ReportsAnalyticsPage() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [timeRange, setTimeRange] = useState("This Month");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    adminApi.dashboard()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, role]);

  const categoriesData = [
    { name: "Chains", amount: formatPrice(data?.total_revenue ? data.total_revenue * 0.34 : 0), percent: 34.1 },
    { name: "Bangles", amount: formatPrice(data?.total_revenue ? data.total_revenue * 0.28 : 0), percent: 28.3 },
    { name: "Sarees", amount: formatPrice(data?.total_revenue ? data.total_revenue * 0.20 : 0), percent: 19.7 },
    { name: "Earrings", amount: formatPrice(data?.total_revenue ? data.total_revenue * 0.11 : 0), percent: 10.8 },
    { name: "Rings", amount: formatPrice(data?.total_revenue ? data.total_revenue * 0.07 : 0), percent: 7.1 }
  ];

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0D0D0D]" size={36} />
      </div>
    );
  }

  const totalSalesFormatted = formatPrice(data?.total_revenue || 0);
  const totalOrdersCount = (data?.total_orders || 0).toLocaleString();
  const totalEarningsFormatted = formatPrice(data?.total_platform_fee || data?.total_revenue ? (data.total_revenue * 0.15) : 0);

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full border border-[#E2DAC8] bg-white flex items-center justify-center text-[#1A1A1A] hover:bg-[#F8F5F0] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Reports &amp; Analytics</h1>
        </div>

        {/* Top 3 Summary Metrics + Dropdown */}
        <div className="flex flex-wrap items-center gap-6 bg-white border border-[#E2DAC8] px-6 py-3 rounded-2xl shadow-2xs">
          
          <div>
            <span className="text-[11px] text-[#808080] block">Total Sales</span>
            <div className="flex items-baseline gap-2">
              <span className="font-cormorant text-xl font-bold text-[#1A1A1A]">{totalSalesFormatted}</span>
              <span className="text-[10px] font-bold text-[#2E7D32] flex items-center gap-0.5">
                <TrendingUp size={10} /> 18.4%
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-[#EFEBE3]" />

          <div>
            <span className="text-[11px] text-[#808080] block">Total Orders</span>
            <div className="flex items-baseline gap-2">
              <span className="font-cormorant text-xl font-bold text-[#1A1A1A]">{totalOrdersCount}</span>
              <span className="text-[10px] font-bold text-[#2E7D32] flex items-center gap-0.5">
                <TrendingUp size={10} /> 15.7%
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-[#EFEBE3]" />

          <div>
            <span className="text-[11px] text-[#808080] block">Total Earnings</span>
            <div className="flex items-baseline gap-2">
              <span className="font-cormorant text-xl font-bold text-[#1A1A1A]">{totalEarningsFormatted}</span>
              <span className="text-[10px] font-bold text-[#2E7D32] flex items-center gap-0.5">
                <TrendingUp size={10} /> 20.2%
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-[#EFEBE3]" />

          {/* Range selector */}
          <div className="relative border border-[#E2DAC8] rounded-xl px-3 py-1.5 bg-[#F8F5F0]">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-xs font-semibold text-[#1A1A1A] bg-transparent appearance-none pr-4 focus:outline-none cursor-pointer"
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

        </div>

      </div>

      {/* Main 2 Columns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Sales Overview Chart */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFEBE3] pb-3">
            <h3 className="font-cormorant text-lg font-bold text-[#1A1A1A]">Sales Overview</h3>
            <span className="text-xs text-[#808080] font-semibold">{timeRange} ˅</span>
          </div>

          <div className="relative h-64 w-full pt-4">
            
            {/* Callout Tooltip at Peak */}
            <div className="absolute right-8 top-12 bg-[#1A1A1A] text-white p-2 rounded-xl text-center shadow-md z-10">
              <p className="font-bold text-xs">{totalSalesFormatted}</p>
              <p className="text-[10px] text-[#A3B899]">31 May</p>
            </div>

            {/* SVG Curve Line Chart */}
            <svg viewBox="0 0 500 200" className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="salesGradReports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D0D0D" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0D0D0D" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Y Axis Grid Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#EFEBE3" strokeDasharray="4 4" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="#EFEBE3" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#EFEBE3" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#EFEBE3" strokeDasharray="4 4" />
              <line x1="0" y1="180" x2="500" y2="180" stroke="#EFEBE3" />

              {/* Area Path */}
              <path
                d="M 0 180 Q 40 120, 80 140 T 160 100 T 240 70 T 320 120 T 400 90 T 500 40 L 500 180 L 0 180 Z"
                fill="url(#salesGradReports)"
              />

              {/* Curve Line */}
              <path
                d="M 0 180 Q 40 120, 80 140 T 160 100 T 240 70 T 320 120 T 400 90 T 500 40"
                fill="none"
                stroke="#0D0D0D"
                strokeWidth="2.5"
              />

              {/* Peak Point */}
              <circle cx="500" cy="40" r="5" fill="#0D0D0D" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between text-[10px] text-[#808080] pt-2 px-1 font-semibold">
              <span>1 May</span>
              <span>6 May</span>
              <span>11 May</span>
              <span>16 May</span>
              <span>21 May</span>
              <span>26 May</span>
              <span>31 May</span>
            </div>

          </div>
        </div>

        {/* Right: Sales by Category */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
          <h3 className="font-cormorant text-lg font-bold text-[#1A1A1A] border-b border-[#EFEBE3] pb-3">
            Sales by Category
          </h3>

          <div className="space-y-5 pt-2">
            {categoriesData.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#1A1A1A] w-20">{cat.name}</span>
                  
                  {/* Progress Bar Container */}
                  <div className="flex-1 mx-4 bg-[#F8F5F0] h-3.5 rounded-full overflow-hidden border border-[#E2DAC8]/50">
                    <div
                      className="bg-[#0D0D0D] h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percent * 2.5}%` }}
                    />
                  </div>

                  <span className="font-bold text-[#1A1A1A] text-right">
                    {cat.amount} <span className="text-[#808080] font-medium text-[11px]">({cat.percent}%)</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}
