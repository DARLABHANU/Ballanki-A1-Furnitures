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
import { notificationApi } from "@/lib/api";

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (isAuthenticated && role === "admin") {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, role]);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

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
    <div className="min-h-screen bg-[#F4F6F4] text-wood-900 font-garamond flex flex-col lg:flex-row">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0 min-h-screen border-r border-wood-950 bg-wood-900">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-64 bg-wood-900 h-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-wood-900 p-1">
              <Menu size={22} />
            </button>

            <div className="relative w-full">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-full pl-9 pr-4 py-1.5 text-xs font-garamond text-wood-900 placeholder-[#808080] focus:outline-none focus:border-[#0D0D0D]"
              />
            </div>
          </div>

          {/* Right Controls: Notifications + Admin Avatar + View Store */}
          <div className="flex items-center gap-4">

            {/* Bell notification */}
            <div className="relative">
              <div
                className="cursor-pointer text-wood-900 hover:text-wood-900"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#E2DAC8] overflow-hidden z-50">
                  <div className="p-3 border-b border-[#EFEBE3] flex justify-between items-center">
                    <h4 className="font-bold text-sm text-wood-900">Notifications</h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => handleMarkAsRead('all')}
                        className="text-[10px] text-[#2E7D32] hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#808080]">No notifications yet</div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif._id || notif.id}
                          className={`p-3 border-b border-[#EFEBE3] last:border-0 hover:bg-[#F8F5F0] transition-colors cursor-pointer ${!notif.is_read ? 'bg-[#F4F9F5]' : ''}`}
                          onClick={() => {
                            if (!notif.is_read) handleMarkAsRead(notif._id || notif.id);
                          }}
                        >
                          <p className="text-xs font-bold text-wood-900">{notif.title}</p>
                          <p className="text-[11px] text-[#666666] mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-[9px] text-[#808080] mt-1">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full pb-20 lg:pb-8">
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
