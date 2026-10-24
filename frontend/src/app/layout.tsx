import {readBranding} from "@/lib/serverBranding";
import BrandingInitializer from "@/components/BrandingInitializer";
import type { Metadata } from "next";
import { Playfair_Display, Inter, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Sparkles, Clock, Hammer } from "lucide-react";
import "./globals.css";
import BrowserPushProvider from "@/components/BrowserPushProvider";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";
import AuthInitializer from "@/components/AuthInitializer";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import SessionGate from "@/components/SessionGate";
import DeliveryLocationInitializer from "@/components/customer/DeliveryLocationInitializer";
import BottomNav from "@/components/layout/BottomNav";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-outfit",
});

export async function generateMetadata():Promise<Metadata>{const b=await readBranding();const image=b.socialImage||b.logoUrl;return {verification:process.env.GOOGLE_SITE_VERIFICATION?{google:process.env.GOOGLE_SITE_VERIFICATION}:undefined,metadataBase:new URL(b.siteUrl),title:b.seoTitle||b.siteName,description:b.seoMeta,applicationName:b.siteName,manifest:"/manifest.webmanifest",appleWebApp:{capable:true,title:b.siteName,statusBarStyle:"default"},openGraph:{title:b.seoTitle||b.siteName,description:b.seoMeta,siteName:b.siteName,type:"website",images:image?[{url:image}]:[]},twitter:{card:"summary_large_image",title:b.seoTitle||b.siteName,description:b.seoMeta,images:image?[image]:[]},icons:{icon:[{url:"/favicon.ico?v=ballanki-20261024",sizes:"any"},{url:"/favicon-48.png?v=ballanki-20261024",type:"image/png",sizes:"48x48"},{url:"/favicon.png?v=ballanki-20261024",type:"image/png",sizes:"96x96"}],shortcut:"/favicon.ico?v=ballanki-20261024",apple:[{url:"/apple-touch-icon.png?v=ballanki-20261024",type:"image/png",sizes:"180x180"}]}};}

// ==========================================
// MAINTENANCE MODE TOGGLE
// Set to true to enable the maintenance screen.
// Set to false to restore the normal website.
// ==========================================
const MAINTENANCE_MODE = false;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="bg-white font-inter text-wood-900 antialiased" suppressHydrationWarning>
        <GoogleAuthProvider><BrowserPushProvider><BrandingInitializer/>
        <ImpersonationBanner />
        {!MAINTENANCE_MODE && <AuthInitializer />}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-inter), sans-serif",
              fontSize: "14px",
              lineHeight: "1.5",
              background: "#ffffff",
              color: "#123337",
              border: "1px solid #d9e2dd",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.12)",
              maxWidth: "min(400px, calc(100vw - 32px))",
              overflowWrap: "anywhere",
            },
            success: { iconTheme: { primary: "#214f40", secondary: "#ffffff" } },
            error: { iconTheme: { primary: "#b42318", secondary: "#ffffff" } },
            loading: { iconTheme: { primary: "#214f40", secondary: "#eaf1ed" } },
          }}
        />

        {MAINTENANCE_MODE ? (
          <div className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 relative overflow-hidden bg-gradient-to-b from-[#193e32] to-[#0c2528] text-[#f7f9f8] selection:bg-[#527565] selection:text-[#193e32]">
            {/* Elegant Background Patterns */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,151,62,0.12),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/royal-feather.png')]" />

            {/* Top Border / Accent */}
            <div className="w-full max-w-6xl mx-auto flex items-center justify-between border-b border-[#527565]/20 pb-6 relative z-10">
              <span className="font-cinzel text-xs tracking-[0.25em] text-[#527565]/80 font-medium uppercase">Est. 2026</span>
              <span className="font-cinzel text-xs tracking-[0.25em] text-[#527565]/80 font-medium uppercase">Luxury Collections</span>
            </div>

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center relative z-10 my-12 animate-fade-up">
              {/* Premium Luxury Gold Crest / Logo Wrapper */}
              <div className="relative mb-8 group">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-[#527565] to-[#f7f9f8] opacity-20 blur-lg group-hover:opacity-40 transition duration-1000" />
                <div className="relative bg-[#193e32]/60 border border-[#527565]/40 p-6 rounded-full inline-flex items-center justify-center w-24 h-24 shadow-2xl backdrop-blur-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Ballanki A1 Furnitures Logo"
                    className="w-14 h-14 object-contain filter brightness-110 drop-shadow-[0_2px_8px_rgba(201,151,62,0.4)]"
                  />
                </div>
              </div>

              {/* Title & Brand */}
              <h1 className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.2em] text-[#f7f9f8] mb-4 drop-shadow-md">
                BALLANKI A1 FURNITURES
              </h1>
              <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-[#527565]/60 to-transparent mx-auto mb-8" />

              {/* Status Message */}
              <h2 className="font-cinzel text-lg md:text-xl font-light tracking-[0.3em] text-[#527565] mb-6 uppercase flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-[#527565] animate-pulse" />
                We'll Be Right Back
                <Sparkles className="w-4 h-4 text-[#527565] animate-pulse" />
              </h2>
              <p className="font-garamond text-base md:text-lg text-[#f7f9f8]/80 font-light leading-relaxed mb-8 max-w-lg mx-auto">
                Our online boutique is currently undergoing scheduled refinement and system upgrades. We are crafting an even more exquisite experience to showcase our fine furniture and premium home decor.
              </p>

              {/* Decorative Luxury Divider */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-12 h-[1px] bg-[#527565]/30" />
                <div className="w-2 h-2 rotate-45 border border-[#527565] bg-transparent" />
                <div className="w-12 h-[1px] bg-[#527565]/30" />
              </div>

              {/* Notice / Secondary Message */}
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#527565]/10 bg-[#193e32]/30 backdrop-blur-sm rounded-full text-xs tracking-wider text-[#527565] font-medium uppercase">
                <Clock className="w-3.5 h-3.5" />
                Scheduled Brief Maintenance
              </div>
            </div>

            {/* Bottom Footer Details */}
            <div className="w-full max-w-6xl mx-auto border-t border-[#527565]/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 text-[10px] tracking-[0.15em] font-medium text-[#f7f9f8]/60 uppercase font-cinzel">
              <p>
                &copy; {new Date().getFullYear()} Ballanki A1 Furnitures. All Rights Reserved.
              </p>
              <p className="normal-case font-garamond text-xs tracking-wide">
                For urgent inquiries: <a href="mailto:support@ballankia1furnitures.com" className="text-[#527565] underline hover:text-[#f7f9f8] transition-colors">support@ballankia1furnitures.com</a>
              </p>
            </div>
          </div>
        ) : (
          <SessionGate>{children}</SessionGate>
        )}
        {!MAINTENANCE_MODE && <DeliveryLocationInitializer />}
        <BottomNav />
        </BrowserPushProvider></GoogleAuthProvider>
      </body>
    </html>
  );
}

