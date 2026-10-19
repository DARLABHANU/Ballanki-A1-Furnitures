"use client";
import {createContext,useCallback,useContext,useEffect,useState} from 'react';
import Cookies from 'js-cookie';
import {Bell,BellOff,Loader2} from 'lucide-react';
import {useAuthStore} from '@/store/authStore';
import {api} from '@/lib/api';
import {getApiError} from '@/lib/utils';
import {clearBrowserPush,enableBrowserPush,pushSupported,PushConfig,syncBrowserPush} from '@/lib/browserPush';
type State={supported:boolean;enabled:boolean;configured:boolean;busy:boolean;error:string;info:string;enable:()=>Promise<void>;disable:()=>Promise<void>;test:()=>Promise<void>};
const Context=createContext<State|null>(null);
export default function BrowserPushProvider({children}:{children:React.ReactNode}){
 const {isAuthenticated,isLoading,user}=useAuthStore();const id=isAuthenticated?String(user?.id||Cookies.get('user_id')||''):'';
 const [supported,setSupported]=useState(false),[config,setConfig]=useState<PushConfig>({enabled:false,public_key:null}),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[info,setInfo]=useState('');
 useEffect(()=>{
  let live=true;setSupported(pushSupported());setEnabled(false);setError('');setInfo('');
  if(isLoading||!pushSupported())return;
  if(!id){void clearBrowserPush(undefined,false).catch(()=>{});return;}
  api.get<PushConfig>('/push/config').then(async({data})=>{if(!live)return;setConfig(data);if(data.enabled&&Notification.permission==='granted'&&localStorage.getItem('push-enabled:'+id)==='true'){const active=await syncBrowserPush(id,()=>live,data.public_key);if(live)setEnabled(active);}else await clearBrowserPush(undefined,false);}).catch(()=>{if(live)setError('Could not check browser notifications. Use Enable to retry.');});
  return()=>{live=false;};
 },[id,isLoading]);
 useEffect(()=>{
  if(!supported)return;
  const received=(event:MessageEvent)=>{if(event.data?.type==='BALLANKI_NOTIFICATION'&&event.data.user_id===id)window.dispatchEvent(new Event('ballanki-notifications'));};
  navigator.serviceWorker.addEventListener('message',received);return()=>navigator.serviceWorker.removeEventListener('message',received);
 },[supported,id]);
 const enable=useCallback(async()=>{
  if(busy||!id)return;setBusy(true);setError('');setInfo('');
  try{
   if(!config.enabled){const {data}=await api.get<PushConfig>('/push/config');setConfig(data);if(data.enabled){setInfo('Ready. Click Enable notifications again to grant permission.');return;}throw new Error('Browser notifications are not configured on the server yet.');}
   await enableBrowserPush(config,id,()=>{const state=useAuthStore.getState();return state.isAuthenticated&&String(state.user?.id||Cookies.get('user_id')||'')===id;});setEnabled(true);setInfo('Browser notifications enabled for this account.');
  }catch(e){setError(getApiError(e));}finally{setBusy(false);}
 },[busy,config,id]);
 const disable=async()=>{if(busy)return;setBusy(true);setError('');setInfo('');try{await clearBrowserPush(id);setEnabled(false);setInfo('Browser notifications disabled on this device.');}catch(e){setError(getApiError(e));}finally{setBusy(false);}};
 const test=async()=>{if(busy)return;setBusy(true);setError('');try{await api.post('/push/test');setInfo('Test queued. A browser notification should appear shortly.');window.dispatchEvent(new Event('ballanki-notifications'));}catch(e){setError(getApiError(e));}finally{setBusy(false);}};
 return <Context.Provider value={{supported,enabled,configured:config.enabled,busy,error,info,enable,disable,test}}>{children}</Context.Provider>;
}
export function BrowserPushControl(){
 const state=useContext(Context);if(!state)return null;
 return <div className="border-t border-[#dce5df] bg-[#f7f9f8] p-3 text-xs text-[#123337]"><p className="mb-2 font-semibold">Browser notifications</p>{state.supported?<><p className="mb-3 text-[11px] leading-5 text-[#63777a]">{state.enabled?'Order and chat updates are enabled on this device.':'Receive order and chat updates even when this tab is closed.'}</p><div className="flex flex-wrap gap-2"><button type="button" disabled={state.busy} onClick={()=>void(state.enabled?state.disable():state.enable())} className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#214f40] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{state.busy?<Loader2 size={13} className="animate-spin"/>:state.enabled?<BellOff size={13}/>:<Bell size={13}/>} {state.enabled?'Disable on this device':'Enable notifications'}</button>{state.enabled&&<button type="button" disabled={state.busy} onClick={()=>void state.test()} className="rounded-lg border border-[#c9d9cf] bg-white px-3 py-2 disabled:opacity-50">Send test</button>}</div></>:<p className="text-[11px] leading-5 text-[#63777a]">Use a supported browser over HTTPS. On iPhone/iPad, add this website to your Home Screen and open it there to enable notifications.</p>}{state.error&&<p role="alert" className="mt-2 text-[11px] leading-5 text-red-700">{state.error}</p>}{state.info&&<p role="status" className="mt-2 text-[11px] leading-5 text-[#315b49]">{state.info}</p>}</div>;
}
