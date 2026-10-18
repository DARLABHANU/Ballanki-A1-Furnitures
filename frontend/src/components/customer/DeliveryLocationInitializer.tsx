"use client";
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {useDeliveryLocationStore} from '@/store/deliveryLocationStore';
import {detectDeliveryLocation} from '@/lib/detectDeliveryLocation';
import DeliveryLocationModal from './DeliveryLocationModal';
export default function DeliveryLocationInitializer(){
 const pathname=usePathname();
 useEffect(()=>{
  if(/^\/(admin|support|promoter)(\/|$)/.test(pathname))return;
  const saved=useDeliveryLocationStore.getState().location;
  if(saved && !saved.approximate)return;
  // Once per tab visit, not on every navigation/reload. Browsers remember permission decisions.
  let attempted=false;try{attempted=sessionStorage.getItem('ballanki-location-requested')==='1';if(!attempted)sessionStorage.setItem('ballanki-location-requested','1');}catch{}
  if(!attempted)void detectDeliveryLocation();
 },[pathname]);
 return <DeliveryLocationModal/>;
}
