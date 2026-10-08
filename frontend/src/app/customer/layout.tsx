"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  Heart,
  User,
  Wallet,
  HelpCircle,
  Search,
  Bell,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import NotificationBell from "@/components/NotificationBell";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/orders", label: "My Orders", icon: ShoppingBag },
  { href: "/customer/cart", label: "Shopping Cart", icon: ShoppingCart },
  { href: "/customer/wishlist", label: "Wishlist", icon: Heart },
  { href: "/customer/profile", label: "My Profile", icon: User },
  { href: "/customer/payments", label: "Payment Methods", icon: Wallet },
  { href: "/customer/support", label: "Help & Support", icon: HelpCircle },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user, isAuthenticated } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0D0D0D] text-wood-100 p-4 font-garamond justify-between">
      
      <div className="space-y-4 overflow-y-auto pr-1">
        {/* Top Store Logo */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-wood-900/50">
          <div className="w-8 h-8 rounded-full bg-[#143323] border border-gold-400/40 flex items-center justify-center text-gold-400">
            ✦
          </div>
          <div>
            <span className="font-cormorant text-lg font-bold text-white tracking-wide block leading-none">Ballanki A1 Furnitures</span>
            <span className="text-[10px] text-wood-300 font-semibold tracking-wider uppercase">Customer Panel</span>
          </div>
        </div>

        {/* Nav Items */}
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/customer/dashboard" && pathname.startsWith(item.href));

            if (isActive) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white text-[#0D0D0D] font-bold text-xs shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-[#0D0D0D]" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
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
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-wood-900/50">
        <button
          onClick={() => {
            logout();
            router.push("/auth/login");
          }}
          className="w-full flex items-center gap-3 px-4 py-2 text-wood-300 hover:text-red-400 text-xs font-semibold transition-colors"
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F4] text-[#1A1A1A] font-garamond flex flex-col lg:flex-row">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 min-h-screen border-r border-wood-950 bg-[#0D0D0D]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-64 bg-[#0D0D0D] h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area + Top Header */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Bar */}
        <header className="bg-white border-b border-[#E2DAC8] px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
          
          {/* Left: Mobile Menu Toggle + Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-[#1A1A1A] p-1">
              <Menu size={22} />
            </button>

            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-full pl-9 pr-4 py-1.5 text-xs font-garamond text-[#1A1A1A] placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
              />
            </div>
          </div>

          {/* Right Controls: Notifications + Customer Avatar + Browse Shop */}
          <div className="flex items-center gap-4">
            
            <NotificationBell />

            {/* Customer profile pill */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#EFEBE3]">
              <div className="w-8 h-8 rounded-full bg-[#0D0D0D] text-white font-bold text-xs flex items-center justify-center border border-[#E2DAC8]">
                {user?.full_name?.[0] || "C"}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#1A1A1A] leading-none truncate max-w-[100px]">
                  {user?.full_name?.split(" ")[0] || "Customer"}
                </p>
                <p className="text-[10px] text-[#808080] flex items-center gap-0.5">
                  Customer <ChevronDown size={10} />
                </p>
              </div>
            </div>

            {/* Browse Shop button */}
            <button
              onClick={() => router.push("/")}
              className="hidden md:inline-flex items-center gap-1.5 bg-[#0D0D0D] hover:bg-[#333333] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <span>Browse Shop</span>
              <ExternalLink size={13} />
            </button>

          </div>

        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-20 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2DAC8] lg:hidden z-40 pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { href: "/customer/orders", label: "Orders", icon: ShoppingBag },
              { href: "/customer/cart", label: "Cart", icon: ShoppingCart },
              { href: "/customer/wishlist", label: "Wishlist", icon: Heart },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/customer/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-2 relative ${
                    isActive ? "text-[#0D0D0D]" : "text-[#808080] hover:text-[#666666]"
                  }`}
                >
                  <div className="relative">
                    <Icon size={20} className={isActive ? "fill-[#0D0D0D]/10" : ""} />
                  </div>
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
