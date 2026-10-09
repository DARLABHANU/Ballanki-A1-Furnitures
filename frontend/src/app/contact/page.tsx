import Link from "next/link";
import { MessageCircle, PackageSearch } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function ContactUsPage() {
  return <div className="flex min-h-screen flex-col bg-white font-garamond text-[#1A1A1A]">
    <Navbar/>
    <main className="flex-1 px-4 py-16"><section className="mx-auto max-w-2xl rounded-3xl border border-[#E2DAC8] bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#EFEBE3] text-[#1B4D3E]"><MessageCircle size={22}/></span>
      <h1 className="mt-4 font-cormorant text-3xl font-bold">Contact the store</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[#666]">Send a message to the store team through support. Your request and replies will be saved with your account so you can follow them.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/customer/support" className="inline-flex items-center gap-2 rounded-xl bg-[#1B4D3E] px-5 py-3 text-sm font-semibold text-white"><MessageCircle size={16}/>Open support</Link><Link href="/customer/orders" className="inline-flex items-center gap-2 rounded-xl border border-[#E2DAC8] px-5 py-3 text-sm font-semibold"><PackageSearch size={16}/>View orders</Link></div>
      <p className="mt-4 text-xs text-[#777]">Sign in is required to create a support request.</p>
    </section></main>
    <Footer/>
  </div>;
}
