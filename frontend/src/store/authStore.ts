import { create } from "zustand";
import { User, UserRole } from "@/types";
import { api, setAuthCookies } from "@/lib/api";
import { useCartStore } from "./cartStore";
import { useWishlistStore } from "./wishlistStore";
import Cookies from "js-cookie";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setAuth: (tokens: { access_token: string; refresh_token: string; role: UserRole; user_id: string | number }) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
  rehydrateFromCookies: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: true, role: user.role, isLoading: false }),

  setAuth: ({ access_token, refresh_token, role, user_id }) => {
    setAuthCookies(access_token, refresh_token);
    Cookies.set("user_role", role, { path: "/" });
    Cookies.set("user_id", String(user_id), { path: "/" });

    set({ role, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    void api.post("/auth/logout").catch(() => {});
    useCartStore.getState().resetCart();
    useWishlistStore.getState().clearWishlist();
    localStorage.removeItem("ballanki-cart-storage");
    sessionStorage.removeItem("checkout-key");
    Cookies.remove("access_token", { path: "/" });
    Cookies.remove("refresh_token", { path: "/" });
    Cookies.remove("user_role", { path: "/" });
    Cookies.remove("user_id", { path: "/" });
    Cookies.remove("impersonator_token", { path: "/" });
    set({ user: null, role: null, isAuthenticated: false, isLoading: false });
    window.location.href = "/auth/login";
  },

  setLoading: (v) => set({ isLoading: v }),

  rehydrateFromCookies: () => {
    const token = Cookies.get("access_token");
    const role = Cookies.get("user_role") as UserRole;

    if (token) {
      set({ isAuthenticated: true, role: role || null, isLoading: false });
    } else {
      set({ isAuthenticated: false, role: null, user: null, isLoading: false });
    }
  },
}));
