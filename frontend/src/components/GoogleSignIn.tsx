"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

type GoogleIdentity = {
  initialize: (options: { client_id: string; callback: (result: { credential: string }) => void; auto_select: boolean }) => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; width: number }) => void;
};

export default function GoogleSignIn() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const router = useRouter();
  const { setAuth, setUser } = useAuthStore();
  const container = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");

  const signIn = useCallback(async (idToken: string, existingPassword?: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const { data } = await authApi.googleLogin({ idToken, ...(existingPassword ? { password: existingPassword } : {}) });
      setAuth(data);
      setUser(data.user);
      setCredential("");
      setPassword("");
      toast.success("Successfully signed in!");
      router.push(data.role === "admin" ? "/admin/dashboard" : data.role === "support" ? "/support/dashboard" : "/");
    } catch (failure: any) {
      if (failure?.response?.data?.code === "GOOGLE_LINK_REQUIRED") {
        setCredential(idToken);
      } else {
        setError(failure?.response?.data?.error || "Google sign-in failed. Please try again.");
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [router, setAuth, setUser]);

  useEffect(() => {
    if (!ready || !clientId || !container.current) return;
    const identity = (window as Window & { google?: { accounts: { id: GoogleIdentity } } }).google?.accounts.id;
    if (!identity) return;
    identity.initialize({ client_id: clientId, auto_select: false, callback: result => { void signIn(result.credential); } });
    const element = container.current;
    const render = () => {
      element.replaceChildren();
      identity.renderButton(element, { theme: "outline", size: "large", text: "continue_with", width: Math.min(400, Math.floor(element.clientWidth)) });
    };
    render();
    const observer = new ResizeObserver(render);
    observer.observe(element);
    return () => { observer.disconnect(); element.replaceChildren(); };
  }, [ready, clientId, signIn]);

  if (!clientId) return null;
  return (
    <div className="space-y-3 w-full" aria-busy={busy}>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setError("Google sign-in could not load. Please use email and password or try again.")} />
      <div ref={container} className={`w-full min-h-11 flex justify-center ${busy ? "pointer-events-none opacity-60" : ""}`} />
      {!ready && !error && <p className="text-center text-xs text-wood-500">Loading Google sign-in…</p>}
      {busy && <p role="status" className="text-center text-xs text-wood-500">Signing in…</p>}
      {credential && (
        <form className="space-y-3 rounded-xl border border-wood-200 p-3" onSubmit={event => { event.preventDefault(); void signIn(credential, password); }}>
          <p className="text-xs text-wood-700">You already have a website account. Confirm its password once to connect Google.</p>
          <label className="block text-xs font-semibold" htmlFor="google-link-password">Existing website password</label>
          <input id="google-link-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-wood-300 px-3 py-2" />
          <button disabled={busy} className="w-full rounded-lg bg-wood-900 px-3 py-2 text-white text-sm disabled:opacity-50">Link Google and sign in</button>
          <button type="button" disabled={busy} onClick={() => { setCredential(""); setPassword(""); setError(""); }} className="w-full text-xs text-wood-600">Cancel</button>
        </form>
      )}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
