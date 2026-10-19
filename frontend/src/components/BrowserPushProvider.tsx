"use client";
import {createContext,useContext,useEffect,useState} from 'react';
import Cookies from 'js-cookie';
import {Bell,X} from 'lucide-react';
import {useAuthStore} from '@/store/authStore';
import {api} from '@/lib/api';
import {getApiError} from '@/lib/utils';
import {clearBrowserPush,enableBrowserPush,pushSupported,PushConfig,syncBrowserPush} from '@/lib/browserPush';
import {requestNotificationPermission} from '@/lib/notificationPermission';
type State={supported:boolean;enabled:boolean;configured:boolean;permission:NotificationPermission;error:string};
const Context=createContext<State|null>(null);
export default function BrowserPushProvider({children}:{children:React.ReactNode}){
 const {isAuthenticated,isLoading,user}=useAuthStore();const id=isAuthenticated?String(user?.id||Cookies.get('user_id')||''):'';
 const [supported,setSupported]=useState(false),[config,setConfig]=useState<PushConfig>({enabled:false,public_key:null}),[enabled,setEnabled]=useState(false),[error,setError]=useState('');
 const [permission,setPermission]=useState<NotificationPermission>('default'),[asking,setAsking]=useState(false),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{
  const supported=pushSupported();setSupported(supported);if(!supported)return;
  setPermission(Notification.permission);
  let live=true;const check=()=>api.get<PushConfig>('/push/config').then(({data})=>{if(live){setConfig(data);setError('');}}).catch(()=>{if(live)setError('Browser notification setup is temporarily unavailable.');});
  void check();const focus=()=>{setPermission(Notification.permission);void check();};window.addEventListener('focus',focus);
  return()=>{live=false;window.removeEventListener('focus',focus);};
 },[]);
 useEffect(()=>{
  if(!supported||!config.enabled||permission!=='default')return;
  let live=true;setAsking(true);void requestNotificationPermission(true).then(value=>{if(live)setPermission(value);}).finally(()=>{if(live)setAsking(false);});
  return()=>{live=false;};
 },[supported,config.enabled,permission]);
 useEffect(()=>{
  let live=true;setEnabled(false);if(isLoading||!supported)return;
  if(!id||permission!=='granted'){void clearBrowserPush(undefined,false).catch(()=>{});return;}
  if(!config.enabled||!config.public_key)return;
  const current=()=>{const state=useAuthStore.getState();return live&&state.isAuthenticated&&String(state.user?.id||Cookies.get('user_id')||'')===id;};
  void (async()=>{const active=await syncBrowserPush(id,current,config.public_key);if(!current())return;if(!active)await enableBrowserPush(config,id,current);if(current()){setEnabled(true);setError('');}})().catch(e=>{if(live)setError(getApiError(e));});
  return()=>{live=false;};
 },[id,isLoading,supported,permission,config.enabled,config.public_key]);
 useEffect(()=>{
  if(!supported)return;
  const received=(event:MessageEvent)=>{if(event.data?.type==='BALLANKI_NOTIFICATION'&&event.data.user_id===id)window.dispatchEvent(new Event('ballanki-notifications'));};
  navigator.serviceWorker.addEventListener('message',received);return()=>navigator.serviceWorker.removeEventListener('message',received);
 },[supported,id]);
 // Browsers that block an on-load prompt require a direct, clearly labelled tap.
 const allow=()=>{setAsking(true);void requestNotificationPermission().then(setPermission).finally(()=>setAsking(false));};
 return <Context.Provider value={{supported,enabled,configured:config.enabled,permission,error}}>{children}
 {supported&&config.enabled&&permission==='default'&&!asking&&!dismissed&&<aside role="region" aria-label="Browser notification permission" className="fixed bottom-24 left-3 right-3 z-[150] mx-auto max-w-md rounded-2xl border border-[#c9d9cf] bg-white p-4 text-[#123337] shadow-xl sm:bottom-6 sm:left-auto sm:right-6"><div className="flex items-start gap-3"><Bell className="mt-1 shrink-0 text-[#214f40]" size={21}/><div className="flex-1"><p className="text-sm font-semibold">Get order and chat updates</p><p className="mt-1 text-xs leading-5 text-[#63777a]">Allow browser notifications so you know when the store replies or your order is ready.{!id?' Updates start after you sign in.':''}</p><button type="button" onClick={allow} className="mt-3 rounded-lg bg-[#214f40] px-4 py-2 text-sm font-semibold text-white">Allow notifications</button></div><button type="button" onClick={()=>setDismissed(true)} aria-label="Dismiss notification request" className="p-1"><X size={17}/></button></div></aside>}
 </Context.Provider>;
}
export function BrowserPushControl(){
 const state=useContext(Context);if(!state)return null;
 return <div className="border-t border-[#dce5df] bg-[#f7f9f8] p-3 text-[11px] leading-5 text-[#63777a]">{!state.supported?'Browser notifications need a supported browser over HTTPS. On iPhone/iPad, open this website from your Home Screen.':state.permission==='denied'?'Browser notifications are blocked. You can allow them in your browser site settings.':state.enabled?'Browser notifications are active for order and chat updates.':!state.configured?'Browser notifications are not available yet.':state.permission==='granted'?'Connecting browser notifications…':'Choose Allow in your browser notification permission request.'}{state.error&&<p role="status" className="mt-1">{state.error}</p>}</div>;
}
