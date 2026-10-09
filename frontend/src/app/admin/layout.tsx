"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Package,
  ShoppingBag,
  MessageCircle,
  Tag,
  BarChart3,
  HelpCircle,
  Settings,
  Wrench,
  Globe,
  ChevronDown,
  LogOut,
  Headphones,
  Search,
  Bell,
  ExternalLink,
  Menu,
  X
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/NotificationBell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  hasDropdown?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users, hasDropdown: true },
  { href: "/admin/users?role=promoter", label: "Promoters", icon: Megaphone },
  { href: "/admin/products", label: "Products", icon: Package, hasDropdown: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/enquiries", label: "Price Enquiries", icon: MessageCircle },
  { href: "/admin/coupons", label: "Coupons & Offers", icon: Tag },
  { href: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { href: "/admin/return-requests", label: "Disputes & Support", icon: HelpCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/marketing", label: "Marketing Tools", icon: Wrench },
  { href: "/admin/website-settings", label: "Website Settings", icon: Globe }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isAuthenticated, role } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarContent = (
    <div className="flex flex-col h-full bg-wood-900 text-wood-100 p-4 font-garamond justify-between">

      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Top Admin Logo */}
        <div className="flex items-center justify-center py-2 border-b border-wood-800/80 mb-2">
          <img
            src="/logo.png"
            alt="Ballanki A1 Furnitures Logo"
            className="h-[55px] w-auto object-contain drop-shadow-sm brightness-110 filter"
          />
        </div>

        {/* Nav Items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            if (isActive) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white text-wood-900 font-bold text-xs shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-wood-900" />
                    <span>{item.label}</span>
                  </div>
                  {item.hasDropdown && <ChevronDown size={14} className="opacity-70" />}
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl text-wood-100/80 hover:bg-white/10 hover:text-white text-xs font-medium transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className="text-wood-300/80" />
                  <span>{item.label}</span>
                </div>
                {item.hasDropdown && <ChevronDown size={14} className="opacity-50" />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Help Box + User Account / Logout */}
      <div className="pt-4 border-t border-wood-900/50 space-y-3">
        <div className="bg-[#2A1C10] border border-wood-800/40 rounded-xl p-3.5 space-y-2">
          <div>
            <h4 className="text-xs font-bold text-white">Need Help?</h4>
            <p className="text-[11px] text-wood-200/70">We are here to help you.</p>
          </div>
          <button
            onClick={() => router.push("/support/dashboard")}
            className="w-full bg-wood-900 hover:bg-[#333333] text-wood-200 border border-wood-700/40 text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <span>Contact Support</span>
            <Headphones size={13} />
          </button>
        </div>

        {/* User Account / Logout */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-wood-800 text-wood-200 font-bold text-xs flex items-center justify-center">
              {user?.full_name?.[0] || "A"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-white leading-none">{user?.full_name?.split(" ")[0] || "Admin"}</p>
              <p className="text-[10px] text-wood-300">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/auth/login");
            }}
            className="text-wood-400 hover:text-red-400 p-1"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

    </div>
  );

  return (
    <div className="dashboard-shell min-h-dvh bg-white text-wood-900 font-garamond flex flex-col lg:flex-row">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 min-h-screen border-r border-wood-950 bg-wood-900">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-64 max-w-[85vw] overflow-y-auto bg-wood-900 h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area + Top Header */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Bar */}
        <header className="bg-white border-b border-[#E2DAC8] px-3 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shadow-2xs">

          {/* Left: Mobile Menu Toggle + Search */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-wood-900 p-1">
              <Menu size={22} />
            </button>

            <div className="relative w-full min-w-0">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-white border border-[#E2DAC8] rounded-full pl-9 pr-4 py-1.5 text-xs font-garamond text-wood-900 placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
              />
            </div>
          </div>

          {/* Right Controls: Notifications + Admin Avatar + View Store */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">

            <NotificationBell />

            {/* Admin profile pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#EFEBE3]">
              <div className="w-8 h-8 rounded-full bg-wood-900 text-white font-bold text-xs flex items-center justify-center border border-[#E2DAC8]">
                {user?.full_name?.[0] || "A"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-wood-900 leading-none truncate max-w-[100px]">
                  {user?.full_name?.split(" ")[0] || "Admin"}
                </p>
                <p className="text-[10px] text-[#808080] flex items-center gap-0.5">
                  Admin <ChevronDown size={10} />
                </p>
              </div>
            </div>

            {/* View Store button */}
            <button
              onClick={() => router.push("/")}
              className="hidden md:inline-flex items-center gap-1.5 bg-wood-900 hover:bg-[#333333] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>View Store</span>
              <ExternalLink size={13} />
            </button>

          </div>

        </header>

        {/* Page Content */}
        <main className="dashboard-content flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2DAC8] lg:hidden z-40 pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { href: "/admin/users", label: "Users", icon: Users },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-2 relative ${isActive ? "text-wood-900" : "text-[#808080] hover:text-[#666666]"
                    }`}
                >
                  <Icon size={20} className={isActive ? "fill-[#0D0D0D]/10" : ""} />
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? "font-bold" : ""}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
