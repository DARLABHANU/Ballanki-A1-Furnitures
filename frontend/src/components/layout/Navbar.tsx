"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingBag, Heart, User, LogOut, Settings, Award,
  Package, Search, ChevronDown, MapPin, Menu, X, Bell,
  Home, Sparkles, Star, Flame, PhoneCall, Tag, LayoutDashboard
} from "lucide-react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useDeliveryLocationStore } from "@/store/deliveryLocationStore";
import { authApi } from "@/lib/api";
import DeliveryLocationModal from "@/components/customer/DeliveryLocationModal";

import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, role } = useAuthStore();
  const { cart, fetchCart } = useCartStore();
  const { wishlistIds, fetchWishlist } = useWishlistStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("all");
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { location: deliveryLocation, openModal } = useDeliveryLocationStore();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    let url = `/customer/products?search=${encodeURIComponent(searchQuery.trim())}`;
    if (searchCategory !== "all") url += `&category=${encodeURIComponent(searchCategory)}`;
    router.push(url);
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const coupon = urlParams.get("coupon");
      if (coupon) {
        Cookies.set("affiliate_coupon", coupon, { expires: 7, sameSite: "Lax" });
        toast.success(`Referral discount code "${coupon.toUpperCase()}" activated!`);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) { fetchCart(); fetchWishlist(); }
  }, [isAuthenticated]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && !user) {
      authApi.me().then((res) => useAuthStore.getState().setUser(res.data)).catch(() => { });
    }
  }, [isAuthenticated]);

  const handleLogout = () => { logout(); router.push("/auth/login"); };
  const dashboardLink = role ? `/${role}/dashboard` : "/auth/login";
  const cartCount = cart?.item_count || 0;

  const isMobileHeaderHidden = false;

  return (
    <>
      {/* ─── Desktop Announcement Bar ─── */}
      <div className="hidden md:block bg-wood-900 text-wood-100 py-1.5 px-4 text-xs font-inter">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span>Premium Materials</span><span>•</span>
            <span>Master Craftsmanship</span><span>•</span>
            <span>Built to Last</span>
          </div>
          <button
            onClick={openModal}
            className="hidden sm:flex items-center gap-1.5 font-medium text-wood-200 hover:text-white transition-colors"
          >
            <MapPin size={13} className="text-wood-300" />
            <span>
              {deliveryLocation
                ? `Deliver to ${deliveryLocation.city}, ${deliveryLocation.pincode}`
                : "White Glove Delivery Available"}
            </span>
            <ChevronDown size={12} className="opacity-70" />
          </button>
        </div>
      </div>

      {/* ─── Main Header ─── */}
      <header
        className={`bg-wood-50 border-b border-wood-100 sticky top-0 z-50 transition-all duration-200 ${isMobileHeaderHidden ? "hidden md:block" : ""
          } ${scrolled ? "shadow-sm bg-wood-50/95 backdrop-blur-md" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 lg:px-8">

          {/* ════════════════════════════════════════════════ */}
          {/* MOBILE HEADER — ☰ | Logo Center | 🔔           */}
          {/* ════════════════════════════════════════════════ */}
          <div className="md:hidden">
            <div className="flex items-center justify-between py-3">
              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-wood-900 rounded-lg hover:bg-wood-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              {/* Center Brand */}
              <Link href="/" className="flex flex-col items-center justify-center">
                <img
                  src="/logo.png"
                  alt="Ballanki A1 Furnitures Logo"
                  className="h-[50px] w-auto object-contain drop-shadow-sm"
                />
              </Link>

              <NotificationBell />
            </div>

            {/* Mobile Search Bar */}
            <form onSubmit={handleSearchSubmit} className="pb-3">
              <div className="flex items-center w-full bg-white border border-wood-200 rounded-lg overflow-hidden focus-within:border-wood-900 transition-all shadow-xs">
                <Search size={15} className="ml-4 text-wood-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for sofas, chairs, tables..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-3 text-xs font-inter text-wood-900 bg-transparent focus:outline-none placeholder-wood-400"
                />
                <button type="submit" className="pr-4 text-wood-500 hover:text-wood-900 transition-colors">
                  <Search size={15} />
                </button>
              </div>
            </form>
          </div>

          {/* ════════════════════════════════════════════════ */}
          {/* DESKTOP HEADER ROW                              */}
          {/* ════════════════════════════════════════════════ */}
          <div className="hidden md:flex items-center justify-between gap-4 py-3.5">
            {/* Logo */}
            <Link href="/" className="flex items-center group flex-shrink-0">
              <img
                src="/logo.png"
                alt="Ballanki A1 Furnitures Logo"
                className="h-[65px] w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Desktop Search */}
            <form onSubmit={handleSearchSubmit} className="flex items-center flex-1 max-w-xl mx-4">
              <div className="flex items-center w-full bg-white border border-wood-200 rounded-lg overflow-hidden shadow-xs focus-within:border-wood-900 focus-within:ring-1 focus-within:ring-wood-900 transition-all">
                <input
                  type="text"
                  placeholder="Search for sofas, dining sets, accent chairs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs font-inter text-wood-900 placeholder-wood-400 bg-transparent focus:outline-none"
                />
                <div className="relative border-l border-wood-100 px-3 py-2.5 bg-wood-50">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="text-xs font-inter font-semibold text-wood-800 bg-transparent appearance-none pr-5 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    <option value="sofas">Sofas</option>
                    <option value="chairs">Chairs</option>
                    <option value="tables">Tables</option>
                    <option value="beds">Beds</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-wood-500 pointer-events-none" />
                </div>
                <button type="submit" className="bg-wood-900 hover:bg-wood-800 text-white p-2.5 px-4 transition-colors" aria-label="Search">
                  <Search size={15} />
                </button>
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
              <NotificationBell />
              <Link href="/customer/orders" className="hidden lg:flex flex-col items-center text-wood-600 hover:text-wood-900 transition-colors group">
                <Package size={19} className="group-hover:scale-105 transition-transform" />
                <span className="text-[10px] font-inter font-medium mt-1">Track Order</span>
              </Link>
              <Link href="/customer/wishlist" className="hidden md:flex flex-col items-center text-wood-600 hover:text-wood-900 transition-colors relative group">
                <div className="relative">
                  <Heart size={19} className="group-hover:scale-105 transition-transform" />
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-wood-900 text-white font-inter text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishlistIds.length > 0 ? wishlistIds.length : 0}
                  </span>
                </div>
                <span className="text-[10px] font-inter font-medium mt-1 hidden sm:inline">Wishlist</span>
              </Link>
              <Link href="/customer/cart" className="hidden md:flex flex-col items-center text-wood-600 hover:text-wood-900 transition-colors relative group">
                <div className="relative">
                  <ShoppingBag size={19} className="group-hover:scale-105 transition-transform" />
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-wood-900 text-white font-inter text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 0 ? cartCount : 0}
                  </span>
                </div>
                <span className="text-[10px] font-inter font-medium mt-1 hidden sm:inline">Cart</span>
              </Link>

              {mounted && isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 text-xs font-inter font-medium text-wood-900 border border-wood-900 px-3 py-1.5 rounded hover:bg-wood-900 hover:text-white transition-colors"
                  >
                    <User size={14} />
                    <span>{user?.full_name?.split(" ")[0] || "Account"}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-wood-200 shadow-lg z-50 rounded-lg overflow-hidden py-1">
                      <Link href={dashboardLink} onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-inter text-wood-900 hover:bg-wood-50"><User size={14} /> Dashboard</Link>
                      <Link href="/customer/support" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-inter text-wood-900 hover:bg-wood-50"><Settings size={14} /> Support Help</Link>
                      {user?.is_promoter && (
                        <Link href="/promoter/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs font-inter text-wood-900 font-semibold hover:bg-wood-50"><Award size={14} /> Affiliate Portal</Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-inter text-red-600 hover:bg-red-50 text-left"><LogOut size={14} /> Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="text-xs font-inter font-medium text-wood-900 border border-wood-900 px-4 py-2 rounded hover:bg-wood-900 hover:text-white transition-colors">
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="hidden md:block bg-wood-50 border-t border-wood-100">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-6 text-xs font-inter font-semibold">
              <div className="relative py-2">
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="bg-wood-900 hover:bg-wood-800 text-white font-inter text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <span>Shop by Category</span>
                  <ChevronDown size={14} />
                </button>
                {categoryDropdownOpen && (
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-wood-200 shadow-xl z-50 rounded-lg overflow-hidden py-2">
                    <Link href="/customer/products?category=sofas" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-inter text-wood-900 hover:bg-wood-50 font-medium">🛋️ Sofas & Lounges</Link>
                    <Link href="/customer/products?category=chairs" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-inter text-wood-900 hover:bg-wood-50 font-medium">🪑 Chairs</Link>
                    <Link href="/customer/products?category=tables" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-inter text-wood-900 hover:bg-wood-50 font-medium">🪚 Tables & Desks</Link>
                    <Link href="/customer/products?category=beds" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-inter text-wood-900 hover:bg-wood-50 font-medium">🛏️ Beds</Link>
                    <div className="border-t border-wood-100 my-1" />
                    <Link href="/customer/products?is_featured=true" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-inter text-wood-900 hover:bg-wood-50">New Arrivals</Link>
                    <Link href="/customer/products?sort_by=total_sold" onClick={() => setCategoryDropdownOpen(false)} className="block px-4 py-2 text-xs font-inter text-wood-900 hover:bg-wood-50">Bestsellers</Link>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 py-2 uppercase tracking-wider text-[11px]">
                <Link href="/" className="bg-wood-200 text-wood-900 px-3 py-1.5 rounded font-bold">Home</Link>

                <div className="relative group py-2">
                  <Link href="/customer/products?category=living" className="text-wood-600 hover:text-wood-900 flex items-center gap-1 transition-colors">Living <ChevronDown size={11} className="opacity-70 group-hover:rotate-180 transition-transform" /></Link>
                  <div className="absolute left-0 top-full hidden group-hover:block w-48 bg-white border border-wood-200 shadow-lg rounded-lg overflow-hidden z-50 pt-1 border-t-2 border-t-wood-900">
                    <div className="py-2 normal-case tracking-normal">
                      <Link href="/customer/products?category=living&subcategory=sofas" className="block px-4 py-2 text-xs text-wood-900 hover:bg-wood-50 font-medium">Sofas</Link>
                      <Link href="/customer/products?category=living&subcategory=tv_units" className="block px-4 py-2 text-xs text-wood-900 hover:bg-wood-50 font-medium">TV Units</Link>
                      <Link href="/customer/products?category=living&subcategory=coffee_tables" className="block px-4 py-2 text-xs text-wood-900 hover:bg-wood-50 font-medium">Coffee Tables</Link>
                    </div>
                  </div>
                </div>

                <div className="relative group py-2">
                  <Link href="/customer/products?category=dining" className="text-wood-600 hover:text-wood-900 flex items-center gap-1 transition-colors">Dining <ChevronDown size={11} className="opacity-70 group-hover:rotate-180 transition-transform" /></Link>
                  <div className="absolute left-0 top-full hidden group-hover:block w-48 bg-white border border-wood-200 shadow-lg rounded-lg overflow-hidden z-50 pt-1 border-t-2 border-t-wood-900">
                    <div className="py-2 normal-case tracking-normal">
                      <Link href="/customer/products?category=dining&subcategory=dining_tables" className="block px-4 py-2 text-xs text-wood-900 hover:bg-wood-50 font-medium">Dining Tables</Link>
                      <Link href="/customer/products?category=dining&subcategory=dining_chairs" className="block px-4 py-2 text-xs text-wood-900 hover:bg-wood-50 font-medium">Dining Chairs</Link>
                    </div>
                  </div>
                </div>

                <Link href="/customer/products?is_featured=true" className="text-wood-600 hover:text-wood-900 transition-colors py-2">New Arrivals</Link>
                <Link href="/customer/products?sort_by=total_sold&sort_order=desc" className="text-wood-600 hover:text-wood-900 transition-colors py-2">Bestsellers</Link>
                <Link href="/about" className="text-wood-600 hover:text-wood-900 transition-colors py-2">About Us</Link>
              </div>
              <button
                onClick={openModal}
                className="ml-auto text-wood-600 flex items-center gap-1 font-semibold hover:text-wood-900 transition-colors"
              >
                <MapPin size={13} /> Deliver to {deliveryLocation ? `${deliveryLocation.city}, ${deliveryLocation.pincode}` : "India"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal is rendered here but only visible when open */}
      <DeliveryLocationModal />

      {/* ════════════════════════════════════════════════ */}
      {/* MOBILE SLIDE-IN DRAWER                          */}
      {/* ════════════════════════════════════════════════ */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[10000] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" />

          {/* Drawer Panel */}
          <div
            className="absolute left-0 top-0 bottom-0 w-64 bg-wood-900 text-wood-100 p-4 shadow-2xl flex flex-col justify-between font-inter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 overflow-y-auto pr-1">
              {/* Drawer Top Header Logo */}
              <div className="flex items-center justify-between border-b border-wood-800 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Ballanki A1 Furnitures Logo"
                    className="h-[45px] w-auto object-contain drop-shadow-sm brightness-110 filter"
                  />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-wood-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="space-y-1">
                {[
                  { href: "/", label: "Home", icon: Home },
                  { href: "/customer/products?category=sofas", label: "Sofas", icon: Sparkles },
                  { href: "/customer/products?category=chairs", label: "Chairs", icon: Tag },
                  { href: "/customer/products?category=tables", label: "Tables", icon: Package },
                  { href: "/customer/products?is_featured=true", label: "New Arrivals", icon: Star },
                  { href: "/customer/products?sort_by=total_sold", label: "Bestsellers", icon: Flame },
                  { href: "/customer/orders", label: "Track Order", icon: ShoppingBag },
                  { href: "/customer/support", label: "Contact Us", icon: PhoneCall },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  if (isActive) {
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-white text-wood-900 font-bold text-xs shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={16} className="text-wood-900" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-2.5 rounded-lg text-wood-300 hover:bg-wood-800 hover:text-white text-xs font-medium transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-wood-400" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer (User Info & Sign Out) */}
            <div className="pt-4 border-t border-wood-800 mt-auto">
              {mounted && isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-2 py-1">
                    <div className="w-8 h-8 rounded-full bg-wood-800 border border-wood-700 flex items-center justify-center text-wood-200 font-playfair font-bold text-sm flex-shrink-0">
                      {user?.full_name?.charAt(0) || "U"}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-inter text-xs font-bold text-white truncate">{user?.full_name}</p>
                      <p className="font-inter text-[10px] text-wood-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-wood-400 hover:text-red-400 text-xs font-semibold transition-colors"
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-white text-wood-900 font-inter text-xs font-bold py-3 rounded-lg block text-center shadow-md hover:bg-wood-100 transition-colors"
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
