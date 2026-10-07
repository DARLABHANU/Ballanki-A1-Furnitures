"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, RefreshCw, Search, UserRound, UserX } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { formatDate, getApiError } from "@/lib/utils";

type StoreUser = { id: string; full_name: string; email: string; role: string; is_active: boolean; created_at: string };

function UsersContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, role } = useAuthStore();
  const [items, setItems] = useState<StoreUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState(params.get("role") || "");
  useEffect(() => { setRoleFilter(params.get("role") || ""); setPage(1); }, [params]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await adminApi.users({ page, page_size: 20, role: roleFilter || undefined, search: search.trim() || undefined });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      const message = getApiError(err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    if (!isAuthenticated || role !== "admin") {
      router.replace("/auth/login");
      return;
    }
    void loadUsers();
  }, [isAuthenticated, role, router, loadUsers]);

  const toggleActive = async (user: StoreUser) => {
    setBusyId(user.id);
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast.success(user.is_active ? "Account deactivated." : "Account activated.");
      await loadUsers();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setBusyId("");
    }
  };

  return <section className="space-y-5 text-wood-900 font-garamond">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="font-cormorant text-3xl font-bold">Users</h1><p className="text-xs text-[#666]">Customer and staff accounts from the store database.</p></div>
      <button onClick={() => void loadUsers()} className="inline-flex items-center gap-2 rounded-lg border border-[#E2DAC8] bg-white px-3 py-2 text-xs font-semibold"><RefreshCw size={14}/>Refresh</button>
    </header>
    <div className="flex flex-wrap gap-3 rounded-2xl border border-[#E2DAC8] bg-white p-4">
      <label className="relative min-w-52 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]"/><input value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or email" className="w-full rounded-lg border border-[#E2DAC8] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#466657]"/></label>
      <select aria-label="Filter users by role" value={roleFilter} onChange={event => { setRoleFilter(event.target.value); setPage(1); }} className="rounded-lg border border-[#E2DAC8] bg-white px-3 py-2 text-sm"><option value="">All account types</option><option value="customer">Customers</option><option value="promoter">Promoters</option><option value="support">Support</option><option value="admin">Administrators</option></select>
    </div>
    {error && <div role="alert" className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span>{error}</span><button onClick={() => void loadUsers()} className="font-bold underline">Retry</button></div>}
    <div className="overflow-hidden rounded-2xl border border-[#E2DAC8] bg-white">
      <div className="border-b border-[#EFEBE3] px-5 py-3 text-xs text-[#666]">{total.toLocaleString()} accounts</div>
      {isLoading ? <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin"/></div> : items.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#F8F5F0] text-xs text-[#666]"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Account type</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{items.map(user => <tr key={user.id} className="border-t border-[#EFEBE3]"><td className="px-5 py-3"><div className="flex items-center gap-2"><UserRound size={16} className="text-[#718478]"/><div><p className="font-semibold">{user.full_name}</p><p className="text-xs text-[#777]">{user.email}</p></div></div></td><td className="px-5 py-3 capitalize">{user.role === "customer" ? "Customer" : user.role}</td><td className="px-5 py-3 text-xs text-[#666]">{formatDate(user.created_at)}</td><td className="px-5 py-3"><span className={user.is_active ? "text-green-700" : "text-red-700"}>{user.is_active ? "Active" : "Inactive"}</span></td><td className="px-5 py-3 text-right"><button disabled={busyId === user.id || user.role === "admin"} onClick={() => void toggleActive(user)} className="inline-flex items-center gap-1 rounded-lg border border-[#E2DAC8] px-2.5 py-1.5 text-xs disabled:opacity-40">{busyId === user.id ? <Loader2 size={13} className="animate-spin"/> : <UserX size={13}/>} {user.is_active ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div> : <p className="p-10 text-center text-sm text-[#777]">No matching accounts.</p>}
      <div className="flex items-center justify-between border-t border-[#EFEBE3] px-5 py-3 text-xs"><span>Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1 || isLoading} onClick={() => setPage(value => value - 1)} className="rounded border border-[#E2DAC8] px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={page >= pages || isLoading} onClick={() => setPage(value => value + 1)} className="rounded border border-[#E2DAC8] px-3 py-1.5 disabled:opacity-40">Next</button></div></div>
    </div>
  </section>;
}

export default function UsersPage() { return <Suspense fallback={<div className="p-8">Loading accounts…</div>}><UsersContent/></Suspense>; }
