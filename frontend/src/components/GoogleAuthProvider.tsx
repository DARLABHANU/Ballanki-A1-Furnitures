"use client";
import Script from 'next/script';
import {createContext,useCallback,useContext,useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {Loader2,X} from 'lucide-react';
import toast from 'react-hot-toast';
import {authApi} from '@/lib/api';
import {useAuthStore} from '@/store/authStore';
import {useDeliveryLocationStore} from '@/store/deliveryLocationStore';
import {googleIdentity,canOfferOneTap,offerOneTap} from '@/lib/googleOneTap';
const GoogleContext=createContext({ready:false,busy:false,error:''});
export const useGoogleAuth=()=>useContext(GoogleContext);
export default function GoogleAuthProvider({children}:{children:React.ReactNode}){
 const clientId=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
 const pathname=usePathname(),router=useRouter();
 const {isAuthenticated,isLoading,setAuth,setUser}=useAuthStore();
 const modalOpen=useDeliveryLocationStore(s=>s.isModalOpen),locating=useDeliveryLocationStore(s=>s.isDetecting);
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [credential,setCredential]=useState(''),[password,setPassword]=useState('');
 const inFlight=useRef(false),initialized=useRef(false);
 const signIn=useCallback(async(idToken:string,existingPassword?:string)=>{
  if(inFlight.current||!idToken||useAuthStore.getState().isAuthenticated)return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   const {data}=await authApi.googleLogin({idToken,...(existingPassword?{password:existingPassword}:{})});
   setAuth(data);setUser(data.user);setCredential('');setPassword('');googleIdentity()?.cancel();
   toast.success('Successfully signed in!');
   if(data.role==='admin')router.push('/admin/dashboard');else if(data.role==='support')router.push('/support/dashboard');else if(pathname.startsWith('/auth/'))router.push('/');else router.refresh();
  }catch(failure:any){
   if(failure?.response?.data?.code==='GOOGLE_LINK_REQUIRED'){setCredential(idToken);googleIdentity()?.cancel();}
   else{const message=failure?.response?.data?.error||'Google sign-in failed. Please use email and password or try again.';setError(message);toast.error(message);}
  }finally{inFlight.current=false;setBusy(false);}
 },[pathname,router,setAuth,setUser]);
 const handler=useRef(signIn);handler.current=signIn;
 const onReady=useCallback(()=>{
  const identity=googleIdentity();if(!identity||!clientId)return;
  // A single configuration owns both One Tap and all explicit Google buttons.
  if(!initialized.current){identity.initialize({client_id:clientId,auto_select:false,cancel_on_tap_outside:true,callback:result=>{void handler.current(result.credential);}});initialized.current=true;}
  setReady(true);
 },[clientId]);
 useEffect(()=>{
  const identity=googleIdentity();
  if(!ready||!identity)return;
  if(!canOfferOneTap(pathname,isAuthenticated,isLoading,modalOpen||locating||!!credential||busy)){identity.cancel();return;}
  let offered=false;try{offered=offerOneTap(identity,sessionStorage);}catch{/* Browsers may suppress One Tap; email sign-in remains available. */}
  return()=>{if(offered)identity.cancel();};
 },[ready,pathname,isAuthenticated,isLoading,modalOpen,locating,credential,busy]);
 const closeLink=()=>{setCredential('');setPassword('');setError('');};
 useEffect(()=>{if(!credential)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!inFlight.current)closeLink();};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close);},[credential]);
 return <GoogleContext.Provider value={{ready,busy,error}}>
  {clientId&&<Script id="google-identity-services" src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={onReady} onError={()=>setError('Google sign-in could not load. Please use email and password.')}/>}
  {children}
  {credential&&<div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"><section role="dialog" aria-modal="true" aria-labelledby="google-link-title" className="w-full max-w-sm rounded-2xl border border-[#d9e2dd] bg-white p-6 text-[#123337] shadow-xl"><div className="flex items-start justify-between gap-3"><h2 id="google-link-title" className="font-inter text-xl font-semibold">Connect your Google account</h2><button type="button" onClick={closeLink} disabled={busy} aria-label="Close Google account linking" className="rounded p-1 disabled:opacity-50"><X size={19}/></button></div><p className="mt-3 text-sm leading-6 text-slate-500">An account already exists with this email. Confirm its website password once to link Google securely.</p><form onSubmit={e=>{e.preventDefault();void signIn(credential,password);}} className="mt-5 space-y-4"><label className="block text-sm font-medium" htmlFor="google-link-password">Existing website password</label><input autoFocus id="google-link-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-xl border border-[#d9e2dd] px-3 py-3 text-base outline-none focus:border-[#214f40]"/>{error&&<p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#214f40] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy&&<Loader2 size={16} className="animate-spin"/>}Link Google and sign in</button><button type="button" disabled={busy} onClick={closeLink} className="w-full py-1 text-sm text-slate-500">Cancel</button></form></section></div>}
 </GoogleContext.Provider>;
}
