"use client";

import { useState, useEffect } from "react";
import { Save, Lock, Building, DollarSign, Bell } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [platformMargin, setPlatformMargin] = useState("0");
  const [promoterDiscount, setPromoterDiscount] = useState("199");
  const [promoterCommission, setPromoterCommission] = useState("100");
  const [platformProfit, setPlatformProfit] = useState("30");
  const [supportEmail, setSupportEmail] = useState("support@ballankia1furnitures.live");
  const [supportPhone, setSupportPhone] = useState("+91 98765 43210");

  useEffect(() => { api.get('/admin/settings').then(({data}) => { if(data.platformMargin !== undefined) setPlatformMargin(String(data.platformMargin)); if(data.promoterDiscount !== undefined) setPromoterDiscount(String(data.promoterDiscount)); if(data.promoterCommission !== undefined) setPromoterCommission(String(data.promoterCommission)); if(data.platformProfit !== undefined) setPlatformProfit(String(data.platformProfit)); if(data.supportEmail !== undefined) setSupportEmail(String(data.supportEmail)); if(data.supportPhone !== undefined) setSupportPhone(String(data.supportPhone)); }).catch(() => toast.error('Could not load settings')); }, []);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.put('/admin/settings', { platformMargin, promoterDiscount, promoterCommission, platformProfit, supportEmail, supportPhone }); toast.success('Settings saved'); } catch (err: any) { toast.error(err.response?.data?.error || 'Could not save settings'); }
  };

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">
      
      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Platform Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Default Pricing & Commission Rules */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#EFEBE3] pb-3">
            <DollarSign className="text-[#0D0D0D]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">Commission &amp; Pricing Formula Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Standard Platform Margin (₹)</label>
              <input
                type="number"
                value={platformMargin}
                onChange={(e) => setPlatformMargin(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              />
              <p className="text-[11px] text-[#808080] mt-1">Customer price is set by the store administrator.</p>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Promoter Coupon Discount Value (₹)</label>
              <input
                type="number"
                value={promoterDiscount}
                onChange={(e) => setPromoterDiscount(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              />
              <p className="text-[11px] text-[#808080] mt-1">Fixed discount given to customer using promoter coupon</p>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Promoter Commission Split (₹)</label>
              <input
                type="number"
                value={promoterCommission}
                onChange={(e) => setPromoterCommission(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-bold text-[#2E7D32] focus:outline-none focus:border-[#0D0D0D]"
              />
              <p className="text-[11px] text-[#808080] mt-1">Direct amount transferred to promoter balance upon purchase</p>
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Platform Profit Share on Coupon (₹)</label>
              <input
                type="number"
                value={platformProfit}
                onChange={(e) => setPlatformProfit(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              />
              <p className="text-[11px] text-[#808080] mt-1">Platform retained profit share on promoter coupon usage</p>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Support Settings */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#EFEBE3] pb-3">
            <Building className="text-[#0D0D0D]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">Contact &amp; Store Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              />
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Support Phone / WhatsApp</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-[#0D0D0D] hover:bg-[#333333] text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Save size={15} />
            <span>Save Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
