import {paymentApi} from "@/lib/api";
import {Order} from "@/types";
import toast from "react-hot-toast";
type Response={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
type Instance={open:()=>void;on:(event:string,callback:(data:any)=>void)=>void};
declare global {interface Window {Razorpay?:new(options:Record<string,unknown>)=>Instance;}}
let scriptPromise:Promise<void>|null=null;
function load(){if(window.Razorpay)return Promise.resolve();if(!scriptPromise)scriptPromise=new Promise<void>((resolve,reject)=>{const script=document.createElement("script");script.src="https://checkout.razorpay.com/v1/checkout.js";script.async=true;script.onload=()=>window.Razorpay?resolve():reject(new Error("Razorpay checkout could not load"));script.onerror=()=>{script.remove();reject(new Error("Razorpay checkout could not load. Please retry."));};document.head.appendChild(script);}).catch(error=>{scriptPromise=null;throw error;});return scriptPromise;}
export async function openRazorpayCheckout(orderId:string|number,prefill?:{name?:string;email?:string;contact?:string}):Promise<{dismissed:boolean;order?:Order}>{
 await load();const {data}=await paymentApi.start(orderId);if(!/^rzp_(test|live)_/.test(data.key_id||"")||!/^order_[A-Za-z0-9]+$/.test(data.razorpay_order_id||"")||!Number.isSafeInteger(data.amount)||data.amount<100||data.currency!=="INR")throw new Error("Invalid payment configuration");
 return new Promise((resolve,reject)=>{let verifying=false,settled=false;const finish=(value:{dismissed:boolean;order?:Order})=>{if(!settled){settled=true;resolve(value);}};const Razorpay=window.Razorpay!;
 const instance=new Razorpay({key:data.key_id,amount:data.amount,currency:"INR",order_id:data.razorpay_order_id,name:"Ballanki A1 Furnitures",description:data.environment==="sandbox"?"Test payment — no real money collected":"Furniture order payment",image:window.location.origin+"/logo.png",prefill,theme:{color:"#203f34"},method:{emi:false,paylater:false},handler:async(response:Response)=>{if(settled||verifying)return;verifying=true;try{const {data:order}=await paymentApi.verify({order_id:orderId,...response});finish({dismissed:false,order});}catch(error){if(!settled){settled=true;reject(error);}}},modal:{ondismiss:()=>{if(!verifying)finish({dismissed:true});}}});
 instance.on("payment.failed",()=>toast.error("Payment failed. You can retry in Razorpay or close checkout."));instance.open();
 });
}
