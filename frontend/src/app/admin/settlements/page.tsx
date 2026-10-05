"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Download, Eye, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

function SettlementsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [settlements, setSettlements] = useState<any[]>([]);
  const [totalSettled, setTotalSettled] = useState(0);
  const [pendingSettlements, setPendingSettlements] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadSettlements();
  }, [isAuthenticated, role, page]);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.withdrawals({ page, page_size: 20 });
      if (data && data.items) {
        setSettlements(data.items);
        setTotalPages(data.pages || 1);
        
        let settledAmount = 0;
        let pendingAmount = 0;
        let completedCount = 0;
        let pendingCount = 0;

        data.items.forEach((item: any) => {
          if (item.status === "approved" || item.status === "completed") {
            settledAmount += item.amount;
            completedCount++;
          } else {
            pendingAmount += item.amount;
            pendingCount++;
          }
        });

        setTotalSettled(settledAmount);
        setPendingSettlements(pendingAmount);
        setCompletedRequests(completedCount);
        setPendingRequests(pendingCount);
      } else {
        setSettlements([]);
      }
    } catch {
      setSettlements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setProcessingId(id);
    try {
      await adminApi.approveWithdrawal(id, { status: "approved" });
      toast.success("Withdrawal marked as successfully paid!");
      loadSettlements();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProcessingId(null);
    }
  };

  const displayList = settlements
    .filter(w => 
      String(w.id).includes(search) || 
      (w.merchant?.business_name || w.user?.full_name || "").toLowerCase().includes(search.toLowerCase())
    )
    .map((w) => ({
      id: w.id,
      withdrawal_id: `#WD${w.id}`,
      store_name: w.merchant?.business_name || w.user?.full_name || "Merchant Store",
      amount: formatPrice(w.amount),
      status: w.status === "approved" || w.status === "completed" ? "Completed" : "Pending",
      date: formatDate(w.created_at)
    }));

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Payouts &amp; Withdrawals</h1>

      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
        
        {/* ── 1. Metrics ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-[#EFEBE3]">
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Paid Out</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{formatPrice(totalSettled)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Pending Payouts</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{formatPrice(pendingSettlements)}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Completed Transfers</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{completedRequests}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Pending Requests</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{pendingRequests}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
            <input
              type="text"
              placeholder="Search withdrawals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1A1A1A] placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
            />
          </div>

          <button
            onClick={() => toast.success("Exporting Payouts CSV...")}
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
                  <th className="pb-3 px-3">Withdrawal ID</th>
                  <th className="pb-3 px-3">Merchant / Store</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Request Date</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                    <td className="py-3.5 px-3 font-extrabold text-[#1A1A1A]">{item.withdrawal_id}</td>
                    <td className="py-3.5 px-3 font-bold text-[#1A1A1A]">{item.store_name}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#1A1A1A]">{item.amount}</td>
                    <td className="py-3.5 px-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-block ${
                        item.status === "Completed" ? "bg-[#EFEBE3] text-[#2E7D32]" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-[#666666] font-medium">{item.date}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.status === "Pending" && (
                          <button
                            onClick={() => handleMarkPaid(item.id)}
                            disabled={processingId === item.id}
                            className="bg-[#0D0D0D] text-white px-3 py-1 rounded-lg text-[11px] font-bold hover:bg-[#333333] transition-colors"
                          >
                            {processingId === item.id ? <Loader2 size={12} className="animate-spin" /> : "Mark Paid (Offline)"}
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/admin/withdrawals/${item.id}`)}
                          className="p-1 text-[#666666] hover:text-[#0D0D0D] transition-colors"
                          title="View Withdrawal Details"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
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
          <button onClick={() => setPage(2)} className="w-7 h-7 rounded-lg text-[#666666] hover:bg-[#F8F5F0] text-xs font-semibold">
            2
          </button>
          <button onClick={() => setPage(3)} className="w-7 h-7 rounded-lg text-[#666666] hover:bg-[#F8F5F0] text-xs font-semibold">
            3
          </button>
          <span className="text-xs text-[#808080] px-1">...</span>
          <button onClick={() => setPage(12)} className="w-7 h-7 rounded-lg text-[#666666] hover:bg-[#F8F5F0] text-xs font-semibold">
            12
          </button>
        </div>

      </div>

    </div>
  );
}

export default function AdminSettlementsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D0D0D]" size={28} /></div>}>
      <SettlementsContent />
    </Suspense>
  );
}
