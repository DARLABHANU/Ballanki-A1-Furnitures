"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Banknote,
  Headphones,
  Instagram,
  Facebook,
  Youtube,
  Send,
  Loader2,
  MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { getApiError } from "@/lib/utils";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/newsletter", { email: email.trim() });
      toast.success("You are subscribed.");
      setEmail("");
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="hidden md:block bg-wood-900 text-wood-100 border-t border-wood-800">

      {/* ── 1. Trust Badges Banner ── */}
      <div className="bg-wood-900 border-b border-wood-800 py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="flex flex-col items-center">
            <Truck size={24} className="text-wood-400 mb-2" />
            <h4 className="font-playfair text-xs font-bold text-white uppercase">White Glove Delivery</h4>
            <p className="font-inter text-[11px] text-wood-400/80 mt-0.5">Delivery charges are shown at checkout</p>
          </div>
          <div className="flex flex-col items-center">
            <RotateCcw size={24} className="text-wood-400 mb-2" />
            <h4 className="font-playfair text-xs font-bold text-white uppercase">Easy Returns</h4>
            <p className="font-inter text-[11px] text-wood-400/80 mt-0.5">See our return policy</p>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck size={24} className="text-wood-400 mb-2" />
            <h4 className="font-playfair text-xs font-bold text-white uppercase">Secure Payments</h4>
            <p className="font-inter text-[11px] text-wood-400/80 mt-0.5">Local orders are saved with payment pending</p>
          </div>
          <div className="flex flex-col items-center">
            <Banknote size={24} className="text-wood-400 mb-2" />
            <h4 className="font-playfair text-xs font-bold text-white uppercase">Advance Deposits</h4>
            <p className="font-inter text-[11px] text-wood-400/80 mt-0.5">See item availability and terms</p>
          </div>
          <div className="flex flex-col items-center col-span-2 md:col-span-1">
            <Headphones size={24} className="text-wood-400 mb-2" />
            <h4 className="font-playfair text-xs font-bold text-white uppercase">Design Support</h4>
            <p className="font-inter text-[11px] text-wood-400/80 mt-0.5">Submit a support ticket from your account</p>
          </div>
        </div>
      </div>

      {/* ── 2. Links Directory ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="Ballanki A1 Furnitures Logo"
                className="h-[60px] w-auto object-contain drop-shadow-sm brightness-110 filter"
              />
            </div>
            <p className="font-inter text-xs text-wood-300 leading-relaxed">
              Crafted with precision. Designed for life. Bringing you authentic, master-crafted furniture built from premium materials to elevate your living spaces.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="w-8 h-8 rounded-full bg-wood-800 flex items-center justify-center text-wood-300" aria-hidden="true">
                <Instagram size={15} />
              </span>
              <span className="w-8 h-8 rounded-full bg-wood-800 flex items-center justify-center text-wood-300" aria-hidden="true">
                <Facebook size={15} />
              </span>
              <span className="w-8 h-8 rounded-full bg-wood-800 flex items-center justify-center text-wood-300" aria-hidden="true">
                <Youtube size={15} />
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-playfair text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-wood-800 pb-2">Shop Categories</h4>
            <ul className="space-y-2.5 font-inter text-xs text-wood-300">
              <li><Link href="/customer/products?category=sofas" className="hover:text-white transition-colors">Sofas & Lounges</Link></li>
              <li><Link href="/customer/products?category=chairs" className="hover:text-white transition-colors">Accent Chairs</Link></li>
              <li><Link href="/customer/products?category=tables" className="hover:text-white transition-colors">Tables & Desks</Link></li>
              <li><Link href="/customer/products?category=beds" className="hover:text-white transition-colors">Beds & Storage</Link></li>
              <li><Link href="/customer/products?is_featured=true" className="hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/customer/products?sort_by=total_sold" className="hover:text-white transition-colors">Bestsellers</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-playfair text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-wood-800 pb-2">Customer Care</h4>
            <ul className="space-y-2.5 font-inter text-xs text-wood-300">
              <li><Link href="/customer/orders" className="hover:text-white transition-colors">Track Your Order</Link></li>
              <li><Link href="/customer/support" className="hover:text-white transition-colors">Help &amp; Support</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping &amp; Delivery Policy</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Return &amp; Refund Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Store Support */}
          <div className="space-y-3 font-inter text-xs text-wood-300">
            <h4 className="font-playfair text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-wood-800 pb-2">Store Support</h4>
            <p>Contact the store team about orders or product questions.</p>
            <Link href="/customer/support" className="inline-flex items-center gap-2 text-white hover:text-wood-200"><MessageCircle size={15}/> Open support</Link>
          </div>

        </div>

        {/* ── 3. Bottom Rights ── */}
        <div className="mt-12 pt-6 border-t border-wood-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-inter text-xs text-wood-500">
          <p>© {new Date().getFullYear()} Ballanki A1 Furnitures. All rights reserved.</p>
          <p>Handcrafted Masterpieces for Modern Homes.</p>
        </div>
      </div>
    </footer>
  );
}
