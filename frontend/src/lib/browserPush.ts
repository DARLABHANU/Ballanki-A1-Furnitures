import {api} from '@/lib/api';
export type PushConfig={enabled:boolean;public_key:string|null};
let operations:Promise<unknown>=Promise.resolve();
function serialized<T>(work:()=>Promise<T>):Promise<T>{const result=operations.catch(()=>{}).then(work);operations=result.catch(()=>{});return result;}
function assertCurrent(current:()=>boolean){if(!current())throw new Error('Your account changed. Enable notifications again for the current account.');}
export function pushSupported(){return typeof window!=='undefined'&&window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;}
function keyBytes(value:string){const raw=atob(value.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function registration(){await navigator.serviceWorker.register('/push-sw.js',{scope:'/',updateViaCache:'none'});return new Promise<ServiceWorkerRegistration>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Notification setup timed out. Please retry.')),15000);navigator.serviceWorker.ready.then(reg=>{clearTimeout(timer);resolve(reg);},error=>{clearTimeout(timer);reject(error);});});}
export async function setPushOwner(reg:ServiceWorkerRegistration,user:string|null){
 if(!reg.active)throw new Error('Notification worker is not ready');
 await new Promise<void>((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>{channel.port1.close();reject(new Error('Notification setup timed out.'));},5000);channel.port1.onmessage=()=>{clearTimeout(timer);channel.port1.close();resolve();};reg.active!.postMessage({type:'PUSH_OWNER',user},[channel.port2]);});
}
export async function enableBrowserPush(config:PushConfig,user:string,current:()=>boolean=()=>true){
 if(!config.enabled||!config.public_key)throw new Error('Browser notifications are not configured yet.');
 const publicKey=config.public_key;
 // Call permission first, directly in the click handler's promise chain (Safari user gesture).
 const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error(permission==='denied'?'Notifications are blocked. Allow them in your browser’s site settings.':'Notification permission was not granted.');
 return serialized(async()=>{assertCurrent(current);const reg=await registration();assertCurrent(current);let subscription=await reg.pushManager.getSubscription();
 const key=keyBytes(publicKey);
 if(subscription?.options.applicationServerKey&&Array.from(new Uint8Array(subscription.options.applicationServerKey)).join(',')!==Array.from(key).join(',')){await subscription.unsubscribe();subscription=null;}
 if(!subscription)subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key.buffer as ArrayBuffer});
 try{assertCurrent(current);await setPushOwner(reg,user);assertCurrent(current);await api.post('/push/subscriptions',{subscription:subscription.toJSON()});assertCurrent(current);localStorage.setItem('push-enabled:'+user,'true');}
 catch(error){await setPushOwner(reg,null).catch(()=>{});await subscription.unsubscribe().catch(()=>{});throw error;}
 });
}
export async function syncBrowserPush(user:string,current:()=>boolean=()=>true,publicKey?:string|null){return serialized(async()=>{
 assertCurrent(current);
 const reg=await navigator.serviceWorker.getRegistration('/');if(!reg)return false;
 const subscription=await reg.pushManager.getSubscription();if(!subscription)return false;
 if(publicKey&&subscription.options.applicationServerKey&&Array.from(new Uint8Array(subscription.options.applicationServerKey)).join(',')!==Array.from(keyBytes(publicKey)).join(',')){await setPushOwner(reg,null);return false;}
 assertCurrent(current);await setPushOwner(reg,user);assertCurrent(current);await api.post('/push/subscriptions',{subscription:subscription.toJSON()});if(!current()){await setPushOwner(reg,null);return false;}return true;
});}
export async function clearBrowserPush(user?:string,removeServer=true){return serialized(async()=>{
 const reg=await navigator.serviceWorker.getRegistration('/');if(!reg)return;
 await setPushOwner(reg,null).catch(()=>{});const sub=await reg.pushManager.getSubscription();
 if(sub){if(removeServer)await api.delete('/push/subscriptions',{data:{endpoint:sub.endpoint}});await sub.unsubscribe();}
 if(user)localStorage.removeItem('push-enabled:'+user);
});}
