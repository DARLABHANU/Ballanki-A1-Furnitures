"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
export default function SessionGate({children}:{children:React.ReactNode}) {
 const pathname=usePathname(),router=useRouter();
 const {isLoading,isAuthenticated,role}=useAuthStore();
 const publicPage=pathname==='/'||pathname.startsWith('/auth/')||!/^\/(admin|merchant|support|promoter|customer)(\/|$)/.test(pathname)||pathname.startsWith('/customer/products')||pathname==='/customer/categories';
 const allowed=publicPage||(isAuthenticated&&(!pathname.startsWith('/admin')||role==='admin')&&(!pathname.startsWith('/merchant')||role==='merchant')&&(!pathname.startsWith('/support')||role==='support'||role==='admin'));
 useEffect(()=>{if(!isLoading&&!allowed)router.replace(isAuthenticated?'/':'/auth/login');},[isLoading,allowed,isAuthenticated,router]);
 if(!publicPage&&(isLoading||!allowed))return <div className="p-16 text-center" role="status">Loading your session…</div>;
 return <>{children}</>;
}
