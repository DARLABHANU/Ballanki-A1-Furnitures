"use client";
import {useEffect,useRef} from 'react';
import {useGoogleAuth} from './GoogleAuthProvider';
import {googleIdentity} from '@/lib/googleOneTap';
export default function GoogleSignIn(){
 const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 const {ready,busy,error}=useGoogleAuth();const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const identity=googleIdentity();if(!ready||!identity||!container.current)return;
  const element=container.current;let width=0;
  const render=()=>{const next=Math.min(400,Math.floor(element.clientWidth));if(next<1||next===width)return;width=next;element.replaceChildren();identity.renderButton(element,{theme:'outline',size:'large',text:'continue_with',width:next});};
  render();const observer=new ResizeObserver(render);observer.observe(element);
  return()=>{observer.disconnect();element.replaceChildren();};
 },[ready]);
 if(!clientId)return null;
 return <div className="w-full space-y-3" aria-busy={busy}><div ref={container} className={`flex min-h-11 w-full justify-center ${busy?'pointer-events-none opacity-60':''}`}/>{!ready&&!error&&<p className="text-center text-xs text-slate-500">Loading Google sign-in…</p>}{busy&&<p role="status" className="text-center text-xs text-slate-500">Signing in…</p>}{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
