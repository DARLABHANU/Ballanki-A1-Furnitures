"use client";

import { useState } from "react";
import { Save, Lock, Bell, Palette, Globe } from "lucide-react";
import { authApi, setAuthCookies, api } from "@/lib/api";
import toast from "react-hot-toast";

export default function MerchantSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [withdrawalAlerts, setWithdrawalAlerts] = useState(true);
  const [reviewAlerts, setReviewAlerts] = useState(false);

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error("All password fields are required"); return; }
    if (newPassword !== confirmPassword) { toast.error("New passwords don't match"); return; }
    try { const {data} = await authApi.changePassword({current_password:currentPassword,new_password:newPassword}); setAuthCookies(data.access_token,data.refresh_token); toast.success("Password updated"); setCurrentPassword("");setNewPassword("");setConfirmPassword(""); } catch(err:any) {toast.error(err.response?.data?.error || "Password could not be updated");}
  };

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Store Settings</h1>

      {/* Change Password */}
      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#EFEBE3] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F8F5F0] border border-[#E2DAC8] flex items-center justify-center">
            <Lock size={18} className="text-[#0D0D0D]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">Change Password</h3>
            <p className="text-[11px] text-[#808080]">Update your login credentials</p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-md">
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              placeholder="Enter current password" />
          </div>
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              placeholder="Enter new password" />
          </div>
          <div>
            <label className="font-bold text-[#1A1A1A] block mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              placeholder="Repeat new password" />
          </div>
          <button onClick={handlePasswordChange}
            className="inline-flex items-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
            <Save size={14} />
            <span>Update Password</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3 border-b border-[#EFEBE3] pb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#F8F5F0] border border-[#E2DAC8] flex items-center justify-center">
            <Bell size={18} className="text-[#0D0D0D]" />
          </div>
          <div>
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">Notification Preferences</h3>
            <p className="text-[11px] text-[#808080]">Configure how you receive alerts</p>
          </div>
        </div>

        <div className="space-y-4 text-xs max-w-md">
          {[
            { label: "Email Notifications", desc: "Receive updates via email", val: emailNotifications, set: setEmailNotifications },
            { label: "New Order Alerts", desc: "Notified when a new order arrives", val: orderAlerts, set: setOrderAlerts },
            { label: "Withdrawal Updates", desc: "Status changes on payout requests", val: withdrawalAlerts, set: setWithdrawalAlerts },
            { label: "Review Alerts", desc: "When customers leave a product review", val: reviewAlerts, set: setReviewAlerts },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between p-3 bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl cursor-pointer">
              <div>
                <span className="font-bold text-[#1A1A1A]">{item.label}</span>
                <p className="text-[11px] text-[#808080] mt-0.5">{item.desc}</p>
              </div>
              <div className="relative">
                <input type="checkbox" checked={item.val} onChange={() => item.set(!item.val)} className="sr-only peer" />
                <div className="w-10 h-5 bg-[#E2DAC8] rounded-full peer-checked:bg-[#2E7D32] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          ))}
        </div>

        <button onClick={() => toast.success("Notification preferences saved!")}
          className="inline-flex items-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs">
          <Save size={14} />
          <span>Save Preferences</span>
        </button>
      </div>
    </div>
  );
}
