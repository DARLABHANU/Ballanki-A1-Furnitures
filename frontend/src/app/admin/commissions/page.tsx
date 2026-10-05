"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Download, DollarSign, Percent, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { formatPrice } from "@/lib/utils";
import { adminApi } from "@/lib/api";

function CommissionsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [commissions, setCommissions] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total_platform_earnings: 0,
    total_seller_commission: 0,
    total_promoter_profit: 0,
    pending_payouts: 0
  });

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (search) params.search = search;
      
      const { data } = await adminApi.commissions(params);
      if (data && data.items) {
        setCommissions(data.items);
        setTotalPages(data.pages || 1);
        setStats({
          total_platform_earnings: data.total_platform_earnings || 0,
          total_seller_commission: data.total_seller_commission || 0,
          total_promoter_profit: data.total_promoter_profit || 0,
          pending_payouts: data.pending_payouts || 0
        });
      } else {
        setCommissions([]);
      }
    } catch {
      setCommissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadCommissions();
  }, [isAuthenticated, role, page]);

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      {/* Page Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Earnings &amp; Commission</h1>

      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Summary Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[#EFEBE3]">
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Platform Earnings</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{formatPrice(stats.total_platform_earnings)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Merchant Commission Margin</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{formatPrice(stats.total_seller_commission)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Promoter Profit Pool</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{formatPrice(stats.total_promoter_profit)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Pending Payout Settlements</span>
            <span className="font-cormorant text-3xl font-[#1A1A1A] text-[#B85C00] font-extrabold">{formatPrice(stats.pending_payouts)}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
            <input
              type="text"
              placeholder="Search earnings record..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1A1A1A] placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
            />
          </div>

          <button
            onClick={() => toast.success("Exporting Commission Report CSV...")}
            className="inline-flex items-center gap-1.5 border border-[#0D0D0D] text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* ── 3. Table ── */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0D0D0D]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFEBE3] text-[#666666] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Earning Type</th>
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Source / Partner</th>
                  <th className="pb-3 px-3">Sale Amount</th>
                  <th className="pb-3 px-3">Rate / Rule</th>
                  <th className="pb-3 px-3">Earned Amount</th>
                  <th className="pb-3 px-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#808080] text-xs font-medium">No commissions found.</td>
                  </tr>
                ) : (
                  commissions.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#1A1A1A] bg-[#F8F5F0] border border-[#E2DAC8] px-2.5 py-1 rounded-md text-[11px]">
                          {item.type || "Margin"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-[#1A1A1A]">#{item.order?.order_number || `ORD${item.order_id}`}</td>
                      <td className="py-3.5 px-3 font-semibold text-[#1A1A1A]">{item.source || "System"}</td>
                      <td className="py-3.5 px-3 font-bold text-[#1A1A1A]">{formatPrice(item.sale_amount || 0)}</td>
                      <td className="py-3.5 px-3 text-[#666666] font-medium">{item.commission_rate || "N/A"}</td>
                      <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{formatPrice(item.amount || 0)}</td>
                      <td className="py-3.5 px-3 text-[#666666] font-medium">{new Date(item.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination Dock ── */}
        <div className="flex items-center justify-between pt-4 border-t border-[#EFEBE3]">
          <span className="text-[11px] text-[#808080] font-medium">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[#E2DAC8] text-[#1A1A1A] hover:bg-[#F8F5F0] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-[#E2DAC8] text-[#1A1A1A] hover:bg-[#F8F5F0] disabled:opacity-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function AdminCommissionsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D0D0D]" size={28} /></div>}>
      <CommissionsContent />
    </Suspense>
  );
}
