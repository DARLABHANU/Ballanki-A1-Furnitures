"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, CheckCircle, XCircle, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatPrice, formatDate, getApiError } from "@/lib/utils";

function ReturnRequestsContent() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();

  const [requests, setRequests] = useState<any[]>([]);
  const [totalDisputes, setTotalDisputes] = useState(0);
  const [pendingReview, setPendingReview] = useState(0);
  const [approvedReturns, setApprovedReturns] = useState(0);
  const [rejectedDisputes, setRejectedDisputes] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !["admin", "support"].includes(role || "")) {
      router.push("/auth/login");
      return;
    }
    loadReturns();
  }, [isAuthenticated, role, page]);

  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.returnRequests({ page, page_size: 20 });
      if (data && data.items) {
        setRequests(data.items);
        setTotalDisputes(data.total);
        setTotalPages(data.pages || 1);
        
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        
        data.items.forEach((r: any) => {
          if (r.status === "pending") pending++;
          else if (r.status === "approved") approved++;
          else if (r.status === "rejected") rejected++;
        });
        
        setPendingReview(pending);
        setApprovedReturns(approved);
        setRejectedDisputes(rejected);
      } else {
        setRequests([]);
      }
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveReturn = async (id: string | number) => {
    setActionId(id);
    try {
      await (adminApi as any).updateReturnRequest(id, { status: "approved" });
      toast.success("Return request approved!");
      loadReturns();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setActionId(null);
    }
  };

  const displayList = requests
    .filter(r => 
      String(r.order_id).includes(search) || 
      (r.user?.full_name || "").toLowerCase().includes(search.toLowerCase()) || 
      (r.product?.merchant?.business_name || "").toLowerCase().includes(search.toLowerCase())
    )
    .map((r) => ({
      id: r.id,
      order_number: `#ORD${r.order_id}`,
      customer_name: r.user?.full_name || "Customer",
      store_name: r.product?.merchant?.business_name || "Store",
      reason: r.reason || "Dispute request",
      amount: formatPrice(r.refund_amount || 0),
      status: r.status === "approved" ? "Approved" : r.status === "rejected" ? "Rejected" : "Pending",
      date: formatDate(r.created_at || new Date().toISOString())
    }));

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Disputes &amp; Return Support</h1>

      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-4 sm:p-6 shadow-xs space-y-6">
        
        {/* ── 1. Metrics ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-6 border-b border-[#EFEBE3]">
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Total Disputes</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#0D0D0D]">{totalDisputes}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Pending Review</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#B85C00]">{pendingReview}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Approved Returns</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#2E7D32]">{approvedReturns}</span>
          </div>
          <div>
            <span className="text-xs font-medium text-[#666666] block mb-1">Rejected Claims</span>
            <span className="font-cormorant text-3xl font-extrabold text-[#1A1A1A]">{rejectedDisputes}</span>
          </div>
        </div>

        {/* ── 2. Controls ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative min-w-0 w-full sm:max-w-xs sm:flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-full pl-9 pr-4 py-2 text-xs font-garamond text-[#1A1A1A] placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
            />
          </div>
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
                  <th className="pb-3 px-3">Order ID</th>
                  <th className="pb-3 px-3">Customer</th>
                  <th className="pb-3 px-3">Store Name</th>
                  <th className="pb-3 px-3">Reason for Dispute</th>
                  <th className="pb-3 px-3">Refund Amount</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE3]">
                {displayList.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-[#808080]">No return requests found.</td></tr>
                ) : (
                  displayList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8F5F0]/60 transition-colors">
                      <td className="py-3.5 px-3 font-extrabold text-[#1A1A1A]">{item.order_number}</td>
                      <td className="py-3.5 px-3 font-semibold text-[#1A1A1A]">{item.customer_name}</td>
                      <td className="py-3.5 px-3 text-[#666666] font-bold">{item.store_name}</td>
                      <td className="py-3.5 px-3">
                        <span className="text-[11px] text-[#666666] bg-[#EFEBE3] px-2 py-1 rounded line-clamp-1 max-w-[200px]" title={item.reason}>
                          {item.reason}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-[#1A1A1A]">{item.amount}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md inline-flex items-center gap-1 ${
                          item.status === "Approved" ? "bg-[#EFEBE3] text-[#2E7D32]" : 
                          item.status === "Rejected" ? "bg-red-50 text-red-700" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          {item.status === "Approved" ? <CheckCircle size={10} /> : item.status === "Rejected" ? <XCircle size={10} /> : <HelpCircle size={10} />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "Pending" && (
                            <>
                              <button
                                onClick={() => handleApproveReturn(item.id)}
                                disabled={actionId === item.id}
                                className="bg-[#0D0D0D] hover:bg-[#333333] text-white px-2 py-1 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
                              >
                                {actionId === item.id ? <Loader2 size={12} className="animate-spin" /> : "Approve"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── 4. Pagination ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#EFEBE3]">
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

export default function AdminReturnRequestsPage() {
  return (
    <Suspense fallback={<div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-[#0D0D0D]" size={28} /></div>}>
      <ReturnRequestsContent />
    </Suspense>
  );
}
