/* Push only: no fetch handler and no caching of accounts, checkout or API data. */
function database(){return new Promise((resolve,reject)=>{const request=indexedDB.open('ballanki-push',1);request.onupgradeneeded=()=>request.result.createObjectStore('meta');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function owner(value,write=false){const db=await database();try{return await new Promise((resolve,reject)=>{const transaction=db.transaction('meta',write?'readwrite':'readonly');const store=transaction.objectStore('meta');let result;const request=write?store.put(value,'owner'):store.get('owner');request.onsuccess=()=>{result=request.result;};transaction.oncomplete=()=>resolve(result);transaction.onerror=()=>reject(transaction.error);});}finally{db.close();}}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type!=='PUSH_OWNER')return;event.waitUntil((async()=>{await owner(typeof event.data.user==='string'?event.data.user:null,true);const notices=await self.registration.getNotifications();for(const notice of notices)if(notice.data?.user_id!==event.data.user)notice.close();event.ports[0]?.postMessage({ok:true});})());});
function safeURL(value){try{if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return self.location.origin+'/';const url=new URL(value,self.location.origin);return url.origin===self.location.origin?url.href:self.location.origin+'/';}catch{return self.location.origin+'/';}}
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let data;try{data=event.data?.json();}catch{return;}
 if(!data?.user_id||await owner()!==data.user_id)return;
 await self.registration.showNotification(String(data.title||'Ballanki A1 Furnitures').slice(0,120),{body:String(data.body||'You have a new update.').slice(0,180),icon:'/logo.png',badge:'/logo.png',tag:'ballanki-'+String(data.id),data:{url:safeURL(data.url),user_id:data.user_id}});
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of windows)client.postMessage({type:'BALLANKI_NOTIFICATION',user_id:data.user_id});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 if(await owner()!==event.notification.data?.user_id)return;
 const url=safeURL(event.notification.data?.url?.replace(self.location.origin,''));
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});const current=windows.find(client=>new URL(client.url).origin===self.location.origin);
 if(current){await current.navigate(url);await current.focus();}else await self.clients.openWindow(url);
})());});
