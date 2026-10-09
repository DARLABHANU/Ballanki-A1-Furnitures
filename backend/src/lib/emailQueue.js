const { EmailJob } = require('../models/Email');
const User = require('../models/User');
const mail = require('./email');
let timer, running=false;
async function enqueue(message) {
 try { await EmailJob.updateOne({key:message.key},{$setOnInsert:message},{upsert:true}); }
 catch(error){if(error.code!==11000)console.error('Email queue write failed:',error.name);}
}
async function notifyUser(userId,title,message,link,key) {
 try {
  const user=await User.findById(userId);
  if(!user?.is_active||!user.email||!user.is_verified) return;
  const recipient=user.role==='admin'&&process.env.ADMIN_NOTIFICATION_EMAIL ? process.env.ADMIN_NOTIFICATION_EMAIL.trim() : user.email;
  await enqueue({key,to:recipient,subject:title+' — Ballanki A1 Furnitures',text:message+'\n\nOpen your account: '+mail.websiteLink(link)+'\n\nSign in to view details and reply. Replies to negotiation emails do not appear in the website chat.'});
 }catch(error){console.error('Email notification could not be queued:',error.name);}
}
async function orderEmail(order,event) {
 try {
  const customer=order.customer?._id||order.customer;
  const text='Order '+order.order_number+'\nStatus: '+order.status.replaceAll('_',' ')+'\nTotal: INR '+Number(order.total_amount).toFixed(2)+(order.amount_due_now!=null?'\nInitial payment required: INR '+order.amount_due_now+'\nPre-book advance (20%): INR '+order.advance_amount+'\nBalance after initial payment: INR '+order.balance_amount:'')+'\nPayment: '+order.payment_status+(order.tracking_number?'\nTracking: '+order.tracking_number:'')+(order.items?.length?'\n\nItems:\n'+order.items.map(item=>item.product_name+' × '+item.quantity).join('\n'):'');
  await notifyUser(customer,'Order '+event,text,'/customer/orders/'+order._id,'order-'+order._id+'-'+event+'-customer');
  const admins=await User.find({role:'admin',is_active:true,is_verified:true});
  for(const admin of admins) await notifyUser(admin._id,event==='placed'?'New order':'Order '+event,text,'/admin/orders/'+order._id,'order-'+order._id+'-'+event+'-'+admin._id);
 }catch(error){console.error('Order email queue failed:',error.name);}
}
async function processQueue() {
 if(running||!mail.configured())return;
 running=true;
 try {
  const now=new Date();
  await EmailJob.updateMany({$or:[{status:{$in:['pending','sending']},createdAt:{$lte:new Date(+now-20*3600000)}},{status:'sending',attempts:{$gte:6},lease_until:{$lt:now}}]},{$set:{status:'failed',last_error:'Retry window expired'}});
  const job=await EmailJob.findOneAndUpdate({attempts:{$lt:6},createdAt:{$gt:new Date(+now-20*3600000)},$or:[{status:'pending',next_attempt:{$lte:now}},{status:'sending',lease_until:{$lt:now}}]},{$set:{status:'sending',lease_until:new Date(+now+30000)},$inc:{attempts:1}},{new:true,sort:{createdAt:1}});
  if(!job)return;
  try {
   const result=await mail.sendEmail(job);
   await EmailJob.updateOne({_id:job._id,status:'sending',attempts:job.attempts},{$set:{status:'sent',provider_id:result.id},$unset:{lease_until:1,last_error:1}});
  }catch(error){
   await EmailJob.updateOne({_id:job._id,status:'sending',attempts:job.attempts},{$set:{status:error.retryable&&job.attempts<6?'pending':'failed',last_error:error.message,next_attempt:new Date(Date.now()+Math.min(3600000,10000*2**job.attempts))},$unset:{lease_until:1}});
   console.error('Email delivery attempt failed:',String(job._id),error.message);
  }
 }catch(error){console.error('Email worker failed:',error.name);}finally{running=false;}
}
function startWorker(){if(!timer){timer=setInterval(()=>{void processQueue();},1000);timer.unref();void processQueue();}}
function stopWorker(){clearInterval(timer);timer=undefined;}
module.exports={enqueue,notifyUser,orderEmail,processQueue,startWorker,stopWorker};
