"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Users, ChevronRight } from "lucide-react";
import { merchantApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, formatPrice } from "@/lib/utils";

function MerchantCustomersContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [customers, setCustomers] = useState<any[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [repeatBuyers, setRepeatBuyers] = useState(0);
  const [newThisMonth, setNewThisMonth] = useState(0);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || role !== "merchant") {
      router.push("/auth/login");
      return;
    }
    loadCustomers();
  }, [isAuthenticated, role]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data } = await merchantApi.customers();
      if (data && data.items) {
        setCustomers(data.items);
        setTotalCustomers(data.total);
        
        const repeats = data.items.filter((c: any) => c.total_orders > 1).length;
        setRepeatBuyers(repeats);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const recentCount = data.items.filter((c: any) => {
          const d = new Date(c.last_order);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
        setNewThisMonth(recentCount);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Store Customers</h1>

      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pb-6 border-b border-[#EFEBE3]">
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Customers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{totalCustomers}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Repeat Buyers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{repeatBuyers}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">New This Month</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{newThisMonth}</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
          <input type="text" placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1A1A1A] placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]" />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EFEBE3] text-[#666666] font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3 px-3">Customer</th>
                <th className="pb-3 px-3">Orders</th>
                <th className="pb-3 px-3">Total Spent</th>
                <th className="pb-3 px-3">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEBE3]">
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-[#808080]">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-[#808080]">No customers found</td></tr>
              ) : (
                filteredCustomers.map((c, idx) => (
                  <tr key={c.user_id || idx} className="hover:bg-[#F8F5F0]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-[#1A1A1A]">{c.name}</p>
                      <p className="text-[11px] text-[#808080]">{c.email}</p>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-[#1A1A1A]">{c.total_orders}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#2E7D32]">{formatPrice(c.total_spent)}</td>
                    <td className="py-3.5 px-3 text-[#666666] font-medium">{formatDate(c.last_order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function MerchantCustomersPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D0D0D]" size={28} /></div>}>
      <MerchantCustomersContent />
    </Suspense>
  );
}
