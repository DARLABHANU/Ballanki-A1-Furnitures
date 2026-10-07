import toast from "react-hot-toast";
import { getApiError } from "@/lib/utils";
import { create } from "zustand";
import { Cart, Product } from "@/types";
import { cartApi } from "@/lib/api";
interface CartState { cart:Cart; isLoading:boolean; fetchCart:()=>Promise<void>; addItem:(productId:string|number,quantity:number,product?:Product)=>Promise<void>; removeItem:(id:string|number)=>Promise<void>; clearCart:()=>Promise<void>; resetCart:()=>void; }
const empty=()=>({items:[],subtotal:0,item_count:0});
export const useCartStore=create<CartState>((set)=>({
 cart:empty(),isLoading:false,
 fetchCart:async()=>{set({isLoading:true});try{const {data}=await cartApi.get();set({cart:data});}catch(e){toast.error(getApiError(e));}finally{set({isLoading:false});}},
 addItem:async(productId,quantity)=>{try{const {data}=await cartApi.add({product_id:productId,quantity});set({cart:data});}catch(e){toast.error(getApiError(e));throw e;}},
 removeItem:async id=>{const {data}=await cartApi.remove(id);set({cart:data});},
 clearCart:async()=>{const {data}=await cartApi.clear();set({cart:data});},
 resetCart:()=>set({cart:empty(),isLoading:false}),
}));
