const crypto=require('crypto');
const phonepe=require('./phonepe');const Attempt=require('../models/PaymentAttempt');const {Order,Notification}=require('../models/Commerce');const {fail}=require('./http');const {orderEmail}=require('./emailQueue');
async function reconcile(attempt){
 if(attempt.environment!==phonepe.environment())fail(409,'This payment belongs to another PhonePe environment. Contact the store.');
 const remote=await phonepe.status(attempt.merchant_order_id);
 if(remote.notFound)return Order.findById(attempt.order);
 if(remote.orderId&&attempt.provider_order_id&&remote.orderId!==attempt.provider_order_id)fail(409,'Payment order mismatch. Contact the store.');
 if(remote.merchantOrderId&&remote.merchantOrderId!==attempt.merchant_order_id)fail(409,'Payment reference mismatch.');
 if(!['PENDING','COMPLETED','FAILED'].includes(remote.state))fail(503,'Payment status is not available yet.');
 if(remote.state==='COMPLETED'&&remote.amount!==attempt.amount_paise)fail(409,'Payment amount mismatch. Contact the store.');
 if(attempt.state==='COMPLETED'&&remote.state!=='COMPLETED')return Order.findById(attempt.order);
 await Attempt.updateOne({_id:attempt._id},{$set:{state:remote.state,last_checked_at:new Date(),...(remote.orderId?{provider_order_id:remote.orderId}:{})}});
 if(remote.state==='COMPLETED'){
  const updated=await Order.findOneAndUpdate({_id:attempt.order,status:{$nin:['cancelled','refunded']},processed_payment_ids:{$ne:attempt.merchant_order_id},$expr:{$lte:[{$add:[{$ifNull:['$paid_amount_paise',0]},attempt.amount_paise]},{$round:[{$multiply:['$total_amount',100]},0]}]}},[
   {$set:{paid_amount_paise:{$add:[{$ifNull:['$paid_amount_paise',0]},attempt.amount_paise]},processed_payment_ids:{$concatArrays:[{$ifNull:['$processed_payment_ids',[]]},[attempt.merchant_order_id]]},payment_method:'phonepe',payment_environment:attempt.environment}},
   {$set:{paid_amount:{$divide:['$paid_amount_paise',100]},outstanding_amount:{$round:[{$subtract:['$total_amount',{$divide:['$paid_amount_paise',100]}]},2]},payment_status:{$cond:[{$gte:['$paid_amount_paise',{$round:[{$multiply:['$total_amount',100]},0]}]},'paid','partially_paid']},status:{$cond:[{$and:[{$eq:['$status','pending']},{$gte:['$paid_amount_paise',{$round:[{$multiply:[{$ifNull:['$amount_due_now','$total_amount']},100]},0]}]}]},'confirmed','$status']},status_history:{$concatArrays:[{$ifNull:['$status_history',[]]},[{status:'payment_received',timestamp:new Date(),note:(attempt.environment==='sandbox'?'Sandbox test payment':'PhonePe payment')+' verified: INR '+(attempt.amount_paise/100).toFixed(2)}]]}}}
  ],{new:true});
  if(updated){await Notification.create({user:updated.customer,title:attempt.environment==='sandbox'?'Test payment verified':'Payment received',message:'Payment verified for '+updated.order_number,link:'/customer/orders/'+updated._id}).catch(()=>{});await orderEmail(updated,'payment received');}
  const order=updated||await Order.findById(attempt.order);if(!order?.processed_payment_ids?.includes(attempt.merchant_order_id))fail(409,'Payment requires manual review. Contact the store.');
  await Attempt.updateOne({_id:attempt._id},{$set:{reconciled:true}});
 }
 if(remote.state==='FAILED')await Attempt.updateOne({_id:attempt._id},{$set:{reconciled:true}});
 if(remote.state!=='PENDING')await Order.updateOne({_id:attempt.order,payment_active_id:attempt.merchant_order_id},{$unset:{payment_active_id:1}});
 return Order.findById(attempt.order);
}
async function start(orderId,customer){
 if(!phonepe.configured())fail(503,'PhonePe is not configured. Contact the store.');
 const now=new Date();let order=await Order.findOneAndUpdate({_id:orderId,customer,status:{$nin:['cancelled','refunded']},payment_status:{$ne:'paid'},$or:[{payment_lock_until:null},{payment_lock_until:{$lte:now}}]},{$set:{payment_lock_until:new Date(+now+90000)}},{new:true});
 if(!order)fail(409,'Payment is already being prepared, paid, or the order is unavailable. Refresh its status.');
 try{
  if(order.payment_active_id){const previous=await Attempt.findOne({merchant_order_id:order.payment_active_id});if(!previous)fail(409,'Payment session is being prepared. Retry shortly.');order=await reconcile(previous);const fresh=await Attempt.findById(previous._id);if(fresh.state==='PENDING'){if(!fresh.redirect_url){const result=await phonepe.pay(fresh);await Attempt.updateOne({_id:fresh._id},{$set:{provider_order_id:result.orderId,redirect_url:result.redirectUrl}});return {redirect_url:result.redirectUrl,environment:fresh.environment,merchant_order_id:fresh.merchant_order_id};}return {redirect_url:fresh.redirect_url,environment:fresh.environment,merchant_order_id:fresh.merchant_order_id};}}
  if(['cancelled','refunded'].includes(order.status)||order.payment_status==='paid')fail(409,'This order cannot be paid.');
  const paid=order.paid_amount_paise||0,total=Math.round(order.total_amount*100),initial=Math.round((order.amount_due_now??order.total_amount)*100);const amount=(paid<initial?initial:total)-paid;
  if(!Number.isSafeInteger(amount)||amount<100)fail(409,'No payable PhonePe amount of at least INR 1 remains. Contact the store.');
  const merchant_order_id='BA_'+crypto.randomUUID().replaceAll('-','');const attempt=await Attempt.create({order:order._id,merchant_order_id,environment:phonepe.environment(),amount_paise:amount,expires_at:new Date(Date.now()+1200000)});
  await Order.updateOne({_id:order._id},{$set:{payment_active_id:merchant_order_id,payment_method:'phonepe',payment_environment:phonepe.environment()}});
  // Persist the attempt before making a network request. An uncertain response must never create a second charge.
  const result=await phonepe.pay(attempt);
  await Attempt.updateOne({_id:attempt._id},{$set:{provider_order_id:result.orderId,redirect_url:result.redirectUrl,expires_at:new Date(result.expireAt||Date.now()+1200000)}});
  return {redirect_url:result.redirectUrl,environment:attempt.environment,merchant_order_id};
 }finally{await Order.updateOne({_id:orderId},{$unset:{payment_lock_until:1}});}
}
async function refresh(order){if(order.payment_active_id){const attempt=await Attempt.findOne({merchant_order_id:order.payment_active_id});if(attempt)return reconcile(attempt);}return order;}
let timer,running=false;
async function poll(){if(running||!phonepe.configured())return;running=true;try{const attempts=await Attempt.find({environment:phonepe.environment(),reconciled:false,$or:[{last_checked_at:null},{last_checked_at:{$lt:new Date(Date.now()-60000)}}]}).sort({last_checked_at:1}).limit(5);for(const attempt of attempts){await Attempt.updateOne({_id:attempt._id},{$set:{last_checked_at:new Date()}});await reconcile(attempt).catch(e=>console.error('Payment reconciliation pending:',String(attempt._id),e.status||500));}}finally{running=false;}}
function startWorker(){if(!timer){timer=setInterval(()=>void poll().catch(()=>console.error('Payment worker unavailable')),30000);timer.unref();}}
function stopWorker(){clearInterval(timer);timer=null;}
module.exports={start,refresh,reconcile,startWorker,stopWorker};
