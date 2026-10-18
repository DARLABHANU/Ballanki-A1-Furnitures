"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";
import GoogleSignIn from "@/components/GoogleSignIn";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState("");

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    if(isLoading)return;
    setError("");
    setIsLoading(true);
    try {
      const res = await authApi.login({ email: email.trim().toLowerCase(), password });
      const { access_token, refresh_token, role, user_id, user } = res.data;

      if (role === "merchant") {
        toast.error("Merchant access is disabled. Please contact the store administrator.");
        return;
      }

      setAuth({ access_token, refresh_token, role, user_id });

      if (user) {
        setUser(user);
      } else {
        // Fetch user profile
        const meRes = await authApi.me();
        setUser(meRes.data);
      }

      toast.success("Successfully signed into Ballanki A1 Furnitures!");

      // Route based on role
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "support") {
        router.push("/support/dashboard");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      if (err?.response?.data?.code === "EMAIL_VERIFICATION_REQUIRED") {
        toast.success("Check your email for your verification code.");
        router.push(`/auth/verify-otp?email=${encodeURIComponent(err.response.data.email)}&purpose=registration`);
        return;
      }
      const message = err?.response?.data?.message || err?.response?.data?.error || "Invalid email or password.";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="w-full">
    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#527365]">Your Ballanki account</p>
    <h2 className="mt-3 font-inter text-2xl font-semibold leading-tight tracking-tight text-[#123337] sm:text-3xl">Welcome back</h2>
    <p className="mt-2 text-sm leading-6 text-[#6b7d80]">Sign in to pick up where you left off.</p>
    <div className="mt-5 mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[#f1f5f3] p-1 text-center text-xs font-semibold sm:text-sm"><Link href="/auth/login" aria-current="page" className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-white px-2 py-2.5 text-[#214f40] shadow-sm">Sign in</Link><Link href="/auth/signup" className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-2 py-2.5 text-[#6b7d80]">Create account</Link></div>
    {error&&<p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={handleCredentialsLogin} className="space-y-4">
      <div><label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-[#36524b]">Email address</label><div className="relative"><Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c95]"/><input id="login-email" name="email" autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required className="block min-h-12 w-full rounded-xl border border-[#d9e2dd] bg-white py-3 pl-11 pr-11 text-base text-[#123337] outline-none transition placeholder:text-[#9ba8a2] focus:border-[#315b49] focus:ring-2 focus:ring-[#315b49]/10 sm:text-sm"/></div></div>
      <div><label htmlFor="login-password" className="mb-2 block text-xs font-semibold text-[#36524b]">Password</label><div className="relative"><Lock size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c95]"/><input id="login-password" name="password" autoComplete="current-password" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" required className="block min-h-12 w-full rounded-xl border border-[#d9e2dd] bg-white py-3 pl-11 pr-11 text-base text-[#123337] outline-none transition placeholder:text-[#9ba8a2] focus:border-[#315b49] focus:ring-2 focus:ring-[#315b49]/10 sm:text-sm"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-[#6b7d80] hover:bg-slate-50">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><div className="mt-2.5 text-right"><Link href="/auth/forgot-password" className="text-xs font-semibold text-[#315b49] hover:underline">Forgot password?</Link></div></div>
      <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#214f40] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#173e31] disabled:cursor-wait disabled:opacity-60">{isLoading?<><Loader2 size={17} className="animate-spin"/>Signing in…</>:"Sign in"}</button>
    </form>
    <div className="my-5 flex items-center gap-4"><span className="h-px flex-1 bg-[#e5eae7]"/><span className="text-xs text-[#94a29b]">or continue with</span><span className="h-px flex-1 bg-[#e5eae7]"/></div><GoogleSignIn/>
    <p className="mt-5 text-center text-xs leading-6 text-[#75867e]">New to Ballanki? <Link href="/auth/signup" className="font-semibold text-[#214f40] hover:underline">Create an account</Link></p>
  </div>;
}
