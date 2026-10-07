"use client";

import { useState, useEffect } from "react";
import { Globe, Save, Image as ImageIcon, Layout, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function WebsiteSettingsPage() {
  const [siteName, setSiteName] = useState("Ballanki A1 Furnitures");
  const [footerText, setFooterText] = useState("© 2026 Ballanki A1 Furnitures. All Rights Reserved. Crafted with Elegance in Guntur, Andhra Pradesh.");
  const [seoTitle, setSeoTitle] = useState("Ballanki A1 Furnitures | Premium Crafted Furniture & Decor");
  const [seoMeta, setSeoMeta] = useState("Shop exquisite handcrafted wooden furniture, modern sofas, classic dining sets, and premium home decor.");

  useEffect(() => { api.get('/admin/website-settings').then(({data}) => { if(data.siteName !== undefined) setSiteName(String(data.siteName)); if(data.footerText !== undefined) setFooterText(String(data.footerText)); if(data.seoTitle !== undefined) setSeoTitle(String(data.seoTitle)); if(data.seoMeta !== undefined) setSeoMeta(String(data.seoMeta)); }).catch(() => toast.error('Could not load settings')); }, []);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.put('/admin/website-settings', { siteName, footerText, seoTitle, seoMeta }); toast.success('Settings saved'); } catch (err: any) { toast.error(err.response?.data?.error || 'Could not save settings'); }
  };

  return (
    <div className="space-y-6 text-[#1A1A1A] font-garamond">

      {/* Title */}
      <h1 className="font-cormorant text-2xl md:text-3xl font-bold text-[#1A1A1A]">Website Configuration &amp; Branding</h1>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Card 1: General Branding */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#EFEBE3] pb-3">
            <Globe className="text-[#0D0D0D]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">Brand &amp; General Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Website Brand Title</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-bold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Footer Copyright Notice</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                required
              />
            </div>
          </div>
        </div>

        {/* Card 2: SEO & Meta */}
        <div className="bg-white border border-[#E2DAC8] rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#EFEBE3] pb-3">
            <ShieldCheck className="text-[#0D0D0D]" size={20} />
            <h3 className="font-cormorant text-xl font-bold text-[#1A1A1A]">SEO &amp; Search Engine Metadata</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Global Meta Title</label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl px-4 py-2.5 font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                required
              />
            </div>

            <div>
              <label className="font-bold text-[#1A1A1A] block mb-1">Global Meta Description</label>
              <textarea
                rows={3}
                value={seoMeta}
                onChange={(e) => setSeoMeta(e.target.value)}
                className="w-full bg-[#F8F5F0] border border-[#E2DAC8] rounded-xl p-4 font-garamond text-xs text-[#1A1A1A] focus:outline-none focus:border-[#0D0D0D]"
                required
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
            <span>Save Website Settings</span>
          </button>
        </div>

      </form>

    </div>
  );
}
