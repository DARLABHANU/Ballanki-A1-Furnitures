"use client";

import {useEffect, useState} from "react";
import {usePathname} from "next/navigation";
import {Download, X} from "lucide-react";
import {useBranding} from "@/store/brandingStore";

type InstallEvent = Event & {prompt: () => Promise<void>; userChoice: Promise<{outcome: "accepted" | "dismissed"}>};
const DISMISSED = "ballanki-install-dismissed";

export default function AppInstallPrompt() {
  const pathname = usePathname();
  const branding = useBranding();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const isInstalled = () => standalone.matches || Boolean((navigator as Navigator & {standalone?: boolean}).standalone);
    setInstalled(isInstalled());
    let dismissed = false;
    try { dismissed = Date.now() - Number(localStorage.getItem(DISMISSED) || 0) < 7 * 86400000; } catch {}
    const timer = window.setTimeout(() => setHidden(dismissed), 6000);
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIos(apple && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent));
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    const displayChanged = () => setInstalled(isInstalled());
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    standalone.addEventListener("change", displayChanged);
    // Share the existing push worker rather than replacing its registration.
    if (window.isSecureContext && "serviceWorker" in navigator) void navigator.serviceWorker.register("/push-sw.js", {scope: "/", updateViaCache: "none"}).catch(() => {});
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", complete);
      standalone.removeEventListener("change", displayChanged);
    };
  }, []);
  function dismiss() {
    setHidden(true);
    try { localStorage.setItem(DISMISSED, String(Date.now())); } catch {}
  }
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      if ((await prompt.userChoice).outcome === "accepted") setInstalled(true);
      else dismiss();
    } catch { setError("Use your browser menu to install this app or add it to your home screen."); }
    finally { setPrompt(null); setBusy(false); }
  }
  const browsing = pathname === "/" || pathname === "/customer/products" || pathname === "/customer/categories" || /^\/customer\/products\/[^/]+$/.test(pathname);
  if (!browsing || hidden || installed || (!prompt && !ios && !error)) return null;
  return (
    <aside aria-label="Install app" className="fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-sm rounded-2xl border border-[#dce5df] bg-white p-4 text-[#123337] shadow-[0_8px_32px_rgba(0,0,0,0.18)] md:inset-x-auto md:bottom-6 md:right-6">
      <button type="button" onClick={dismiss} aria-label="Dismiss install invitation" className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#edf4ef]"><X size={18}/></button>
      <div className="flex items-center gap-3 pr-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={branding.logoUrl || "/icon-192.png"} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain"/>
        <div><h2 className="text-sm font-bold">Install {branding.siteName}</h2><p className="mt-1 text-xs leading-5 text-slate-600">Open your furniture store directly from your home screen.</p></div>
      </div>
      {ios ? <p className="mt-3 rounded-xl bg-[#edf4ef] p-3 text-sm leading-6">In Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>. Leave <strong>Open as Web App</strong> enabled and tap <strong>Add</strong>.</p> : error ? <p role="status" className="mt-3 text-sm">{error}</p> : <button type="button" disabled={busy} onClick={() => void install()} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#214f40] px-4 py-3 text-sm font-semibold text-white hover:bg-[#193e32] disabled:opacity-60"><Download size={17}/>{busy ? "Opening install…" : "Install app"}</button>}
      <button type="button" onClick={dismiss} className="mt-1 min-h-10 w-full text-xs font-medium text-slate-600">Not now</button>
    </aside>
  );
}
