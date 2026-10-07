"use client";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { authApi, clearAuth } from "@/lib/api";
import Cookies from "js-cookie";
export default function AuthInitializer() {
 useEffect(() => {
  const state=useAuthStore.getState();
  if(!Cookies.get('access_token')&&!Cookies.get('refresh_token')) { state.setLoading(false);return; }
  authApi.me().then(({data})=>state.setUser(data)).catch(()=>{clearAuth();state.rehydrateFromCookies();state.setLoading(false);});
 },[]);
 return null;
}
