"use client";
import {useEffect,useState} from 'react';
// Refresh a browsing estimate across midnight, including when returning to an open tab.
export function useDeliveryClock(){
 const [now,setNow]=useState(()=>new Date());
 useEffect(()=>{
  const update=()=>setNow(new Date());
  const timer=window.setInterval(update,60000);
  window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);
  return()=>{window.clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};
 },[]);
 return now;
}
