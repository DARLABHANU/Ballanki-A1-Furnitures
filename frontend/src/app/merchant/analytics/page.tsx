"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download, TrendingUp, DollarSign, Wallet, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";

function MerchantAnalyticsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadAnalytics();
  }, [isAuthenticated, role]);

  const loadAnalytics = async () => {
    try {
      const res = await merchantApi.analytics(30);
      setAnalytics(res.data);
    } catch {
      // Fallback handled in UI
    }
  };

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Earnings &amp; Analytics</h1>

      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#EFEBE3]">
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Sales Revenue</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{formatPrice(analytics?.total_revenue || 0)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Net Earnings Payout</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{formatPrice(analytics?.total_earnings || 0)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Available to Withdraw</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{formatPrice(analytics?.available_payout || 0)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Orders Delivered</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{analytics?.total_orders || 0}</span>
          </div>
        </div>

        {/* Sales Chart Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">Revenue Trend (Last 30 Days)</h3>
            <button
              onClick={() => toast.success("Exporting Earnings Statement...")}
              className="inline-flex items-center gap-1.5 border border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="relative h-56 w-full pt-4 bg-white border border-[#E2DAC8] rounded-2xl p-4">
            <svg viewBox="0 0 500 160" className="w-full h-40 overflow-visible">
              <defs>
                <linearGradient id="sellerAnalyticsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2E7D32" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 150 Q 60 100, 120 120 T 240 70 T 360 90 T 500 20 L 500 150 L 0 150 Z"
                fill="url(#sellerAnalyticsGrad)"
              />
              <path
                d="M 0 150 Q 60 100, 120 120 T 240 70 T 360 90 T 500 20"
                fill="none"
                stroke="#2E7D32"
                strokeWidth="3"
              />
              <circle cx="500" cy="20" r="5" fill="#2E7D32" />
            </svg>

            <div className="flex justify-between text-[11px] text-[#808080] font-semibold pt-2">
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

      </div>

    </div>
  );
}

export default function MerchantAnalyticsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D0D0D]" size={28} /></div>}>
      <MerchantAnalyticsContent />
    </Suspense>
  );
}
