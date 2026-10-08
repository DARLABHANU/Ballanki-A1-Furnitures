"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { useAuthStore } from "@/store/authStore";

// Removed /customer so the bottom nav shows up throughout the shopping experience on mobile.
// Hide on Admin/internal dashboards to preserve their separate sidebars.
const HIDDEN_PREFIXES = ["/admin", "/promoter", "/support"];

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: Home,
    match: (path: string) => path === "/",
  },
  {
    label: "Categories",
    href: "/customer/products",
    icon: LayoutGrid,
    match: (path: string) => path.startsWith("/customer/products"),
  },
  {
    label: "Wishlist",
    href: "/customer/wishlist",
    icon: Heart,
    match: (path: string) => path.startsWith("/customer/wishlist"),
    badge: "wishlist",
  },
  {
    label: "Cart",
    href: "/customer/cart",
    icon: ShoppingBag,
    match: (path: string) => path.startsWith("/customer/cart"),
    badge: "cart",
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: User,
    match: (path: string) =>
      path.startsWith("/customer/profile") ||
      path.startsWith("/customer/orders") ||
      path.startsWith("/customer/dashboard") ||
      path.startsWith("/auth/"),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cart } = useCartStore();
  const { wishlistIds } = useWishlistStore();

  // Hide ONLY on internal staff portals
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const cartCount = cart?.item_count || 0;
  const wishlistCount = wishlistIds.length || 0;

  return (
    <nav
      className={`store-bottom-nav fixed bottom-0 left-0 right-0 z-40 pb-safe lg:hidden`}
      style={{
        background: "#F8F5F0",
        borderTop: "1.5px solid #E2DAC8",
        boxShadow: "0 -2px 24px rgba(42, 28, 16, 0.10)", // wood-900 shadow
      }}
    >
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          const Icon = item.icon;
          const href = item.href;

          const badge =
            item.badge === "cart"
              ? cartCount
              : item.badge === "wishlist"
                ? wishlistCount
                : 0;

          return (
            <Link
              key={item.label}
              href={href}
              className="flex-1 flex flex-col items-center justify-center relative transition-colors duration-200"
              style={{ minHeight: 62, paddingTop: 12, paddingBottom: 8 }}
            >
              {/* Active top pill */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-300"
                  style={{ width: 28, height: 3, background: "#bd740f" }}
                />
              )}

              {/* Icon + badge */}
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={{ color: isActive ? "#bd740f" : "#D99443" }}
                  className="transition-colors duration-200"
                />
                {badge > 0 && (
                  <span
                    className="absolute flex items-center justify-center rounded-full text-white font-bold animate-fade-in"
                    style={{
                      top: -6,
                      right: -9,
                      minWidth: 17,
                      height: 17,
                      fontSize: 9.5,
                      background: "#bd740f",
                      paddingInline: 3,
                    }}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>

              {/* Label */}
              <span
                style={{
                  marginTop: 4,
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#bd740f" : "#bd740f",
                  lineHeight: 1,
                  fontFamily: "var(--font-outfit, sans-serif)",
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* iOS home-indicator safe area */}
      <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
    </nav>
  );
}
