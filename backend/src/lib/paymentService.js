const crypto=require('crypto');
const gateway=require('./razorpay');const Attempt=require('../models/PaymentAttempt');const {Order,Notification}=require('../models/Commerce');const {fail}=require('./http');const {orderEmail}=require('./emailQueue');
async function reconcile(attempt){
 if(attempt.provider!=='razorpay')fail(409,'This is a legacy payment. Contact the store before changing payment providers.');
 if(attempt.environment!==gateway.environment())fail(409,'This payment belongs to another Razorpay environment. Contact the store.');
 const remote=await gateway.status(attempt);
 if(remote.notFound)return Order.findById(attempt.order);
 if(remote.orderId&&attempt.provider_order_id&&remote.orderId!==attempt.provider_order_id)fail(409,'Payment order mismatch. Contact the store.');
 if(remote.merchantOrderId&&remote.merchantOrderId!==attempt.merchant_order_id)fail(409,'Payment reference mismatch.');
 if(!['PENDING','COMPLETED','FAILED'].includes(remote.state))fail(503,'Payment status is not available yet.');
 if(remote.state==='COMPLETED'&&remote.amount!==attempt.amount_paise)fail(409,'Payment amount mismatch. Contact the store.');
 if(attempt.state==='COMPLETED'&&remote.state!=='COMPLETED')return Order.findById(attempt.order);
 await Attempt.updateOne({_id:attempt._id},{$set:{state:remote.state,last_checked_at:new Date(),...(remote.orderId?{provider_order_id:remote.orderId}:{}),...(remote.paymentId?{provider_payment_id:remote.paymentId}:{})}});
 if(remote.state==='COMPLETED'){
  const updated=await Order.findOneAndUpdate({_id:attempt.order,status:{$nin:['cancelled','refunded']},processed_payment_ids:{$ne:attempt.merchant_order_id},$expr:{$lte:[{$add:[{$ifNull:['$paid_amount_paise',0]},attempt.amount_paise]},{$round:[{$multiply:['$total_amount',100]},0]}]}},[
   {$set:{paid_amount_paise:{$add:[{$ifNull:['$paid_amount_paise',0]},attempt.amount_paise]},processed_payment_ids:{$concatArrays:[{$ifNull:['$processed_payment_ids',[]]},[attempt.merchant_order_id]]},payment_method:'razorpay',payment_environment:attempt.environment}},
   {$set:{paid_amount:{$divide:['$paid_amount_paise',100]},outstanding_amount:{$round:[{$subtract:['$total_amount',{$divide:['$paid_amount_paise',100]}]},2]},payment_status:{$cond:[{$gte:['$paid_amount_paise',{$round:[{$multiply:['$total_amount',100]},0]}]},'paid','partially_paid']},status:{$cond:[{$and:[{$eq:['$status','pending']},{$gte:['$paid_amount_paise',{$round:[{$multiply:[{$ifNull:['$amount_due_now','$total_amount']},100]},0]}]}]},'confirmed','$status']},status_history:{$concatArrays:[{$ifNull:['$status_history',[]]},[{status:'payment_received',timestamp:new Date(),note:(attempt.environment==='sandbox'?'Sandbox test payment':'Razorpay payment')+' verified: INR '+(attempt.amount_paise/100).toFixed(2)}]]}}}
  ],{new:true});
  if(updated){await Notification.create({user:updated.customer,title:attempt.environment==='sandbox'?'Test payment verified':'Payment received',message:'Payment verified for '+updated.order_number,link:'/customer/orders/'+updated._id}).catch(()=>{});await orderEmail(updated,'payment received');}
  const order=updated||await Order.findById(attempt.order);if(!order?.processed_payment_ids?.includes(attempt.merchant_order_id))fail(409,'Payment requires manual review. Contact the store.');
  await Attempt.updateOne({_id:attempt._id},{$set:{reconciled:true}});
 }
 if(remote.state==='FAILED')await Attempt.updateOne({_id:attempt._id},{$set:{reconciled:true}});
 if(remote.state!=='PENDING')await Order.updateOne({_id:attempt.order,payment_active_id:attempt.merchant_order_id},{$unset:{payment_active_id:1}});
 return Order.findById(attempt.order);
}
function checkout(attempt){return {key_id:process.env.RAZORPAY_KEY_ID,order_id:attempt.provider_order_id,razorpay_order_id:attempt.provider_order_id,amount:attempt.amount_paise,currency:'INR',environment:attempt.environment,merchant_order_id:attempt.merchant_order_id};}
async function ensureGatewayOrder(attempt){if(attempt.provider_order_id)return attempt;const remote=await gateway.pay(attempt);return Attempt.findByIdAndUpdate(attempt._id,{$set:{provider_order_id:remote.id}},{new:true});}
async function start(orderId,customer){
 if(!gateway.configured())fail(503,'Razorpay is not configured. Contact the store.');
 const now=new Date(),lock=crypto.randomUUID();let order=await Order.findOneAndUpdate({_id:orderId,customer,status:{$nin:['cancelled','refunded']},payment_status:{$ne:'paid'},$or:[{payment_lock_until:null},{payment_lock_until:{$lte:now}}]},{$set:{payment_lock_until:new Date(+now+90000),payment_lock_token:lock}},{new:true});
 if(!order)fail(409,'Payment is already being prepared, paid, or the order is unavailable. Refresh its status.');
 try{
  if((order.paid_amount_paise||0)>0&&order.payment_environment!==gateway.environment())fail(409,'Test and live payments cannot be mixed on an order. Contact the store.');
  if(order.payment_active_id){let previous=await Attempt.findOne({merchant_order_id:order.payment_active_id});if(!previous)fail(409,'Payment session is missing. Contact the store.');
   if(previous.provider!=='razorpay'){
    if(previous.environment!=='sandbox')fail(409,'An earlier payment provider has an active transaction. Contact the store before paying again.');
    await Order.updateOne({_id:orderId,payment_lock_token:lock,payment_active_id:previous.merchant_order_id},{$unset:{payment_active_id:1}});
   }else{previous=await ensureGatewayOrder(previous);order=await reconcile(previous);if((await Attempt.findById(previous._id)).state==='PENDING')return checkout(previous);}
  }
  if(['cancelled','refunded'].includes(order.status)||order.payment_status==='paid')fail(409,'This order cannot be paid.');
  const paid=order.paid_amount_paise||0,total=Math.round(order.total_amount*100),initial=Math.round((order.amount_due_now??order.total_amount)*100),amount=(paid<initial?initial:total)-paid;
  if(!Number.isSafeInteger(amount)||amount<100)fail(400,'No payable Razorpay amount of at least INR 1 remains. Contact the store.');
  const attempt=await Attempt.create({provider:'razorpay',order:order._id,merchant_order_id:'BA_'+crypto.randomBytes(16).toString('hex'),environment:gateway.environment(),amount_paise:amount});
  const updated=await Order.updateOne({_id:orderId,payment_lock_token:lock},{$set:{payment_active_id:attempt.merchant_order_id,payment_method:'razorpay',payment_environment:gateway.environment()}});if(!updated.modifiedCount)fail(409,'Checkout changed. Refresh before retrying.');
  return checkout(await ensureGatewayOrder(attempt));
 }finally{await Order.updateOne({_id:orderId,payment_lock_token:lock},{$unset:{payment_lock_until:1,payment_lock_token:1}});}
}
async function verify(orderId,customer,body){
 const order=await Order.findOne({_id:orderId,customer});if(!order)fail(404,'Order not found');
 if(typeof body.razorpay_order_id!=='string'||typeof body.razorpay_payment_id!=='string'||typeof body.razorpay_signature!=='string'||!/^pay_[A-Za-z0-9]+$/.test(body.razorpay_payment_id))fail(400,'Invalid payment response');
 const attempt=await Attempt.findOne({order:orderId,provider:'razorpay',provider_order_id:body.razorpay_order_id});if(!attempt)fail(400,'Payment order does not belong to this order');
 if(attempt.environment!==gateway.environment()||!gateway.signature(attempt.provider_order_id,body.razorpay_payment_id,body.razorpay_signature))fail(400,'Payment signature verification failed');
 const payment=await gateway.payment(body.razorpay_payment_id);if(payment.order_id!==attempt.provider_order_id||payment.amount!==attempt.amount_paise||payment.currency!=='INR')fail(409,'Payment details do not match');
 return reconcile(attempt);
}
async function refresh(order){if(order.payment_active_id){const attempt=await Attempt.findOne({merchant_order_id:order.payment_active_id});if(attempt?.provider==='razorpay')return reconcile(attempt);}return order;}
let timer,running=false;
async function poll(){if(running||!gateway.configured())return;running=true;try{const attempts=await Attempt.find({provider:'razorpay',environment:gateway.environment(),provider_order_id:{$exists:true},reconciled:false,$or:[{last_checked_at:null},{last_checked_at:{$lt:new Date(Date.now()-60000)}}]}).sort({last_checked_at:1}).limit(5);for(const attempt of attempts){await Attempt.updateOne({_id:attempt._id},{$set:{last_checked_at:new Date()}});await reconcile(attempt).catch(e=>console.error('Payment reconciliation pending:',String(attempt._id),e.status||500));}}finally{running=false;}}
function startWorker(){if(!timer){timer=setInterval(()=>void poll().catch(()=>console.error('Payment worker unavailable')),30000);timer.unref();}}
function stopWorker(){clearInterval(timer);timer=null;}
module.exports={start,verify,refresh,reconcile,startWorker,stopWorker};
