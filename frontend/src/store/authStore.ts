import { create } from "zustand";
import { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User) => void;
  setAuth: (tokens: { access_token: string; refresh_token: string; role: UserRole; user_id: number }) => void;
  logout: () => void;
  setLoading: (v: boolean) => void;
  rehydrateFromCookies: () => void;
}

const MOCK_USER: User = {
  id: 1,
  email: "guest@ballankia1furnitures.com",
  full_name: "Premium Guest",
  role: "customer",
  account_number: "OH-GUEST-001",
  is_active: true,
  is_verified: true,
  created_at: new Date().toISOString()
};

export const useAuthStore = create<AuthState>((set) => ({
  user: MOCK_USER,
  role: "customer",
  isAuthenticated: true,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: true, role: user.role, isLoading: false }),

  setAuth: ({ role }) => {
    set({ role, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    // In mock mode, don't actually log out.
    // Or just re-assign the mock user:
    set({ user: MOCK_USER, role: "customer", isAuthenticated: true, isLoading: false });
  },

  setLoading: (v) => set({ isLoading: v }),

  rehydrateFromCookies: () => {
    set({
      user: MOCK_USER,
      isAuthenticated: true,
      role: "customer",
      isLoading: false,
    });
  },
}));
