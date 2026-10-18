"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Loader2, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !fullName.trim()) return;

    if(isLoading)return;
    setError("");
    setIsLoading(true);
    try {
      const res = await authApi.signup({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: "customer"
      });
      if (res.data.requires_verification) {
        toast.success(res.data.message);
        router.push(`/auth/verify-otp?email=${encodeURIComponent(res.data.email)}&purpose=registration`);
        return;
      }
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
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="w-full">
    <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#527365]">Your Ballanki account</p>
    <h2 className="mt-3 font-inter text-2xl font-semibold leading-tight tracking-tight text-[#123337] sm:text-3xl">Create your account</h2>
    <p className="mt-2 text-sm leading-6 text-[#6b7d80]">Create an account to save favourites, chat with us, and track your orders.</p>
    <div className="mt-5 mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[#f1f5f3] p-1 text-center text-xs font-semibold sm:text-sm"><Link href="/auth/login" className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg px-2 py-2.5 text-[#6b7d80]">Sign in</Link><Link href="/auth/signup" aria-current="page" className="flex min-h-11 items-center justify-center whitespace-nowrap rounded-lg bg-white px-2 py-2.5 text-[#214f40] shadow-sm">Create account</Link></div>
    {error&&<p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800">{error}</p>}
    <form onSubmit={handleSignup} className="space-y-4">
      <div><label htmlFor="signup-fullName" className="mb-2 block text-xs font-semibold text-[#36524b]">Full name</label><div className="relative"><User size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c95]"/><input id="signup-fullName" name="fullName" autoComplete="name" type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" required className="block min-h-12 w-full rounded-xl border border-[#d9e2dd] bg-white py-3 pl-11 pr-11 text-base text-[#123337] outline-none transition placeholder:text-[#9ba8a2] focus:border-[#315b49] focus:ring-2 focus:ring-[#315b49]/10 sm:text-sm"/></div></div>
      <div><label htmlFor="signup-email" className="mb-2 block text-xs font-semibold text-[#36524b]">Email address</label><div className="relative"><Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c95]"/><input id="signup-email" name="email" autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required className="block min-h-12 w-full rounded-xl border border-[#d9e2dd] bg-white py-3 pl-11 pr-11 text-base text-[#123337] outline-none transition placeholder:text-[#9ba8a2] focus:border-[#315b49] focus:ring-2 focus:ring-[#315b49]/10 sm:text-sm"/></div></div>
      <div><label htmlFor="signup-password" className="mb-2 block text-xs font-semibold text-[#36524b]">Password</label><div className="relative"><Lock size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c95]"/><input id="signup-password" name="password" autoComplete="new-password" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a password" required minLength={8} className="block min-h-12 w-full rounded-xl border border-[#d9e2dd] bg-white py-3 pl-11 pr-11 text-base text-[#123337] outline-none transition placeholder:text-[#9ba8a2] focus:border-[#315b49] focus:ring-2 focus:ring-[#315b49]/10 sm:text-sm"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} aria-pressed={showPassword} className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-[#6b7d80] hover:bg-slate-50">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div><p className="mt-2 text-[11px] text-[#82928a]">Use at least 8 characters.</p></div>
      <button type="submit" disabled={isLoading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#214f40] px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#173e31] disabled:cursor-wait disabled:opacity-60">{isLoading?<><Loader2 size={17} className="animate-spin"/>Creating account…</>:"Create account"}</button>
    </form>
    <p className="mt-5 text-center text-xs leading-6 text-[#75867e]">Already part of the family? <Link href="/auth/login" className="font-semibold text-[#214f40] hover:underline">Sign in</Link></p>
  </div>;
}
