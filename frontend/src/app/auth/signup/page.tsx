"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, ShieldCheck, Sparkles, User, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;

    setIsLoading(true);
    try {
      const res = await authApi.signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "customer"
      });
      const { access_token, refresh_token, role, user_id, user } = res.data;

      setAuth({ access_token, refresh_token, role, user_id });

      if (user) {
        setUser(user);
      } else {
        const meRes = await authApi.me();
        setUser(meRes.data);
      }

      toast.success("Account created successfully. Welcome to Ballanki A1 Furnitures!");
      router.push("/");
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.response?.data?.error || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-wood-900 font-inter w-full">
      <div className="mb-5 text-center">
        <span className="text-[10px] font-bold tracking-widest text-wood-600 bg-wood-200/50 border border-wood-200 px-2.5 py-1 rounded-md uppercase inline-flex items-center gap-1">
          <Sparkles size={10} className="text-wood-500 animate-pulse" />
          BECOME A CLIENT
        </span>
        <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-wood-900 mt-2">Register</h2>
        <p className="text-xs text-wood-500 mt-1 leading-relaxed max-w-sm mx-auto">
          Create an account to track custom furniture reservations and save items.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4 w-full">
        <div>
          <label className="text-xs font-bold text-wood-600 block mb-1 uppercase tracking-wider">
            FULL NAME
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wood-400 w-4 h-4" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-white border border-wood-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-wood-900 focus:outline-none focus:border-wood-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-wood-600 block mb-1 uppercase tracking-wider">
            EMAIL ADDRESS
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wood-400 w-4 h-4" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@ballankia1furnitures.com"
              className="w-full bg-white border border-wood-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-wood-900 focus:outline-none focus:border-wood-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-wood-600 block mb-1 uppercase tracking-wider">
            PASSWORD
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-wood-400 w-4 h-4" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-wood-300 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-wood-900 focus:outline-none focus:border-wood-900"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-2 bg-wood-900 hover:bg-wood-950 text-white py-3.5 rounded-xl text-xs font-bold uppercase transition-all shadow-md active:scale-95 disabled:opacity-50 mt-4"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs text-wood-500 font-medium font-inter">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-wood-900 font-bold hover:underline">
          Sign In
        </Link>
      </p>

      {/* Security Badge */}
      <div className="bg-wood-100 border border-wood-200 p-3 rounded-xl flex items-center gap-2.5 w-full mt-4">
        <ShieldCheck className="text-wood-900 flex-shrink-0" size={16} />
        <p className="text-[10px] text-wood-900 font-bold uppercase tracking-wider leading-snug">
          256-bit AES Encryption.
        </p>
      </div>
    </div>
  );
}
