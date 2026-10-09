"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Plus, Trash2, Tag, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

function CouponsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [coupons, setCoupons] = useState<any[]>([]);
  const [totalCoupons, setTotalCoupons] = useState(0);
  const [activeCoupons, setActiveCoupons] = useState(0);
  const [promoterCoupons, setPromoterCoupons] = useState(0);
  const [platformCoupons, setPlatformCoupons] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadCoupons();
  }, [isAuthenticated, role, page]);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.coupons();
      if (data && data.items) {
        setCoupons(data.items);
        setTotalCoupons(data.total || 0);
        let active = 0;
        let promoterCount = 0;
        let platformCount = 0;
        data.items.forEach((c: any) => {
          if (c.is_active) active++;
          if (c.promoter_commission) promoterCount++;
          else platformCount++;
        });
        setActiveCoupons(active);
        setPromoterCoupons(promoterCount);
        setPlatformCoupons(platformCount);
      } else {
        setCoupons([]);
      }
    } catch {
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    const code = window.prompt("Enter new Coupon Code (e.g. WELCOME100):");
    if (!code) return;
    const amount = Number(window.prompt("Discount amount in rupees:", "100"));
    if(!Number.isFinite(amount) || amount <= 0) return toast.error("Enter a positive discount amount");
    try { await adminApi.createCoupon({code:code.trim().toUpperCase(),discount_type:"fixed",discount_value:amount}); toast.success("Coupon saved"); await loadCoupons(); } catch (err) { toast.error(getApiError(err)); }
  };

  const handleDeleteCoupon = async (id: string | number, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    setDeletingId(id);
    try {
      await adminApi.deleteCoupon(id);
      toast.success("Coupon deleted successfully");
      loadCoupons();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const displayList = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description || "General Coupon",
    discount_value: c.discount_type === "percentage" ? `${c.discount_value}% Off` : formatPrice(c.discount_value),
    promoter_commission: c.promoter_commission ? formatPrice(c.promoter_commission) : "N/A",
    platform_profit: c.platform_profit ? formatPrice(c.platform_profit) : "N/A",
    usage_count: c.used_count || 0,
    is_active: c.is_active,
    created_at: formatDate(c.created_at || "2025-05-30T10:00:00Z")
  }));

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Coupons &amp; Offers</h1>

      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-4 sm:p-6 shadow-xs space-y-6">
        
        {/* ── 1. Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[#EFEBE3]">
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{totalCoupons}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Active Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{activeCoupons}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Promoter Coupons</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{promoterCoupons}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Platform Discount Offers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{platformCoupons}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative min-w-0 w-full sm:max-w-xs sm:flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
            <input
              type="text"
              placeholder="Search coupons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E2DAC8] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1A1A1A] placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
            />
          </div>

          <button
            onClick={handleCreateCoupon}
            className="inline-flex items-center gap-1.5 bg-[#0D0D0D] hover:bg-[#333333] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus size={15} />
            <span>Create Coupon</span>
          </button>
        </div>

        {/* ── 3. Table ── */}
        <div className="min-w-0 max-w-full overflow-x-auto">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#0D0D0D]" size={32} />
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EFEBE3] text-[#666666] font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">Code</th>
                  <th className="pb-3 px-3">Description</th>
                  <th className="pb-3 px-3">Discount</th>
                  <th className="pb-3 px-3">Promoter Share</th>
                  <th className="pb-3 px-3">Platform Share</th>
                  <th className="pb-3 px-3">Times Used</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <span className="bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-md text-xs border border-red-200">
                        {item.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#1A1A1A] max-w-xs truncate">{item.description}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1A1A1A]">{item.discount_value}</td>
                    <td className="py-3.5 px-3 font-bold text-[#2E7D32]">{item.promoter_commission}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1A1A1A]">{item.platform_profit}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1A1A1A]">{item.usage_count}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${
                        item.is_active ? "bg-[#EFEBE3] text-[#2E7D32]" : "bg-red-50 text-red-700"
                      }`}>
                        {item.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => handleDeleteCoupon(item.id, item.code)}
                        className="p-1 text-[#666666] hover:text-red-600 transition-colors"
                        title="Delete Coupon"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination ── */}
        <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-[#EFEBE3]">
          <button onClick={() => setPage(1)} className="w-7 h-7 rounded-lg bg-[#0D0D0D] text-white font-bold text-xs flex items-center justify-center shadow-xs">
            1
          </button>
          <button onClick={() => setPage(2)} className="w-7 h-7 rounded-lg text-[#666666] hover:bg-white text-xs font-semibold">
            2
          </button>
          <button onClick={() => setPage(3)} className="w-7 h-7 rounded-lg text-[#666666] hover:bg-white text-xs font-semibold">
            3
          </button>
        </div>

      </div>

    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D0D0D]" size={28} /></div>}>
      <CouponsContent />
    </Suspense>
  );
}
