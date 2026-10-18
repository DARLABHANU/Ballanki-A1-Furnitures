import {api} from '@/lib/api';
import {useDeliveryLocationStore,DeliveryLocation} from '@/store/deliveryLocationStore';
let pending:Promise<void>|null=null;
export function detectDeliveryLocation(force=false):Promise<void>{
 if(pending)return pending;
 const initial=useDeliveryLocationStore.getState().location;
 if(!force && initial && !initial.approximate)return Promise.resolve();
 const run=async()=>{
  const store=useDeliveryLocationStore.getState();store.setDetection(true);
  try{
   if(!window.isSecureContext||!navigator.geolocation)throw new Error('Automatic location is unavailable. Please enter your PIN code.');
   const read=()=>new Promise<GeolocationPosition>((resolve,reject)=>{
    const deadline=setTimeout(()=>reject({code:3}),15000);
    navigator.geolocation.getCurrentPosition(value=>{clearTimeout(deadline);resolve(value);},error=>{clearTimeout(deadline);reject(error);},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
   });
   const validate=(value:GeolocationPosition)=>{
    const c=value.coords;
    if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude)||Math.abs(c.latitude)>90||Math.abs(c.longitude)>180||!Number.isFinite(c.accuracy)||c.accuracy<0||c.accuracy>100)throw new Error('Your device location is too approximate to identify a reliable PIN code. Enable precise location or enter your PIN code manually.');
    if(!Number.isFinite(value.timestamp)||Math.abs(Date.now()-value.timestamp)>30000)throw new Error('Your device returned an old location. Please enter your delivery PIN code or retry with precise location enabled.');
   };
   const first=await read();validate(first);
   const second=await read();validate(second);
   const radians=(degrees:number)=>degrees*Math.PI/180;
   const lat=radians(second.coords.latitude-first.coords.latitude),lon=radians(second.coords.longitude-first.coords.longitude);
   const h=Math.sin(lat/2)**2+Math.cos(radians(first.coords.latitude))*Math.cos(radians(second.coords.latitude))*Math.sin(lon/2)**2;
   const distance=6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
   if(distance>200)throw new Error('Your device returned conflicting locations. Please enter your delivery PIN code manually.');
   const position=second.coords.accuracy<=first.coords.accuracy?second:first;
   const {data}=await api.post<DeliveryLocation>('/location/reverse',{latitude:position.coords.latitude,longitude:position.coords.longitude});
   if(!/^[1-9]\d{5}$/.test(data.pincode)||!data.city||!data.state)throw new Error('No nearby PIN code was found. Please enter it manually.');
   // A manual selection made while GPS was resolving must win.
   if(useDeliveryLocationStore.getState().location===initial)useDeliveryLocationStore.getState().setDetectedLocation({...data,source:'device',approximate:true});
   store.setDetection(false);
  }catch(error:any){
   const message=error?.code===1?'Location permission is blocked. Enter your PIN code, or allow location in your browser settings.':error?.code===3?'Location detection timed out. Please retry or enter your PIN code.':error?.code===2?'Your device could not find its location. Please enter your PIN code.':error?.response?.data?.error||error?.message||'Could not detect your location. Please enter your PIN code.';
   useDeliveryLocationStore.getState().setDetection(false,message);
   if(!useDeliveryLocationStore.getState().location)useDeliveryLocationStore.getState().openModal();
  }
 };
 pending=run().finally(()=>{pending=null;});return pending;
}
