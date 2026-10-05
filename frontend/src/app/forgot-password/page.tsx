"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { getApiError } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP & New Password, 3: Success
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success("Password reset code sent to your email!");
      setStep(2);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast.error("Please enter the verification code sent to your email.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email,
        otp,
        new_password: newPassword,
      });
      toast.success("Password reset successfully!");
      setStep(3);
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-[#F8F5F0] font-garamond text-[#1A1A1A]">
      <div className="bg-white max-w-md w-full p-8 border border-[#E2DAC8] rounded-3xl shadow-xs relative overflow-hidden">
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-[#0D0D0D] bg-[#EFEBE3] border border-[#E2DAC8] px-2.5 py-1 rounded-md uppercase inline-block">
                PASSWORD RECOVERY
              </span>
              <h1 className="font-cormorant text-3xl font-bold text-[#1A1A1A]">Recover Account</h1>
              <p className="text-xs text-[#808080] max-w-xs mx-auto leading-relaxed">
                Enter your registered email below, and we will send you a verification code to reset your password.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#808080]" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl pl-10 pr-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : "SEND RECOVERY CODE"}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-xs font-bold text-[#0D0D0D] hover:underline">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold tracking-widest text-[#0D0D0D] bg-[#EFEBE3] border border-[#E2DAC8] px-2.5 py-1 rounded-md uppercase inline-block">
                VERIFICATION CODE
              </span>
              <h1 className="font-cormorant text-3xl font-bold text-[#1A1A1A]">Set New Password</h1>
              <p className="text-xs text-[#808080] max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit recovery code to <strong className="text-[#1A1A1A]">{email}</strong>.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">VERIFICATION CODE (6 DIGITS)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-mono text-center text-base font-bold tracking-widest text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">NEW PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">CONFIRM NEW PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : "RESET & SAVE PASSWORD"}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#808080] hover:text-[#1A1A1A]"
              >
                <ArrowLeft size={14} /> Change Email
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 bg-[#EFEBE3] border border-[#E2DAC8] rounded-full flex items-center justify-center mx-auto text-[#2E7D32]">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-2">
              <h1 className="font-cormorant text-3xl font-bold text-[#1A1A1A]">Password Reset!</h1>
              <p className="text-xs text-[#808080] max-w-xs mx-auto leading-relaxed">
                Your account password has been updated successfully. You can now sign in using your new credentials.
              </p>
            </div>

            <Link
              href="/auth/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-xs block"
            >
              PROCEED TO SIGN IN
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
