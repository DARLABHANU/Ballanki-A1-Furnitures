const crypto=require('crypto'),webpush=require('web-push');
const {PushSubscription,PushJob}=require('../models/Push');
const {Notification}=require('../models/Commerce');const User=require('../models/User');const {fail}=require('./http');
let timer,running=false;
function configured(){try{if(!process.env.VAPID_PUBLIC_KEY||!process.env.VAPID_PRIVATE_KEY||!process.env.VAPID_SUBJECT)return false;webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);return true;}catch{return false;}}
function safeLink(value){return typeof value==='string'&&value.length<2000&&value.startsWith('/')&&!value.startsWith('//')&&!/[\\\r\n]/.test(value)?value:'/';}
function validateSubscription(value){
 if(!value||typeof value.endpoint!=='string'||value.endpoint.length>2048)fail(400,'Invalid browser subscription');
 let url;try{url=new URL(value.endpoint);}catch{fail(400,'Invalid push endpoint');}
 // A subscription is a server-side network destination. Only browser push providers are allowed.
 const host=url.hostname.toLowerCase();const allowed=['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].includes(host)||host.endsWith('.notify.windows.com');
 if(url.protocol!=='https:'||url.username||url.password||url.hash||(url.port&&url.port!=='443')||!allowed)fail(400,'Unsupported browser push endpoint');
 const {p256dh,auth}=value.keys||{};
 if(typeof p256dh!=='string'||typeof auth!=='string'||!/^[A-Za-z0-9_-]{87}$/.test(p256dh)||!/^[A-Za-z0-9_-]{22}$/.test(auth)||Buffer.from(p256dh,'base64url')[0]!==4)fail(400,'Invalid browser encryption keys');
 return {endpoint:value.endpoint,endpoint_hash:crypto.createHash('sha256').update(value.endpoint).digest('hex'),keys:{p256dh,auth}};
}
async function subscribe(user,subscription){
 const data=validateSubscription(subscription),old=await PushSubscription.findOne({endpoint_hash:data.endpoint_hash});
 if(!old&&await PushSubscription.countDocuments({user:user._id})>=20)fail(409,'Too many subscribed devices. Disable notifications on an old device first.');
 const sameOwner=old&&String(old.user)===String(user._id)&&old.token_version===(user.token_version||0);
 await PushSubscription.findOneAndUpdate({endpoint_hash:data.endpoint_hash},{$set:{...data,user:user._id,token_version:user.token_version||0,last_seen:new Date(),subscribed_at:sameOwner?old.subscribed_at:new Date()}},{upsert:true,new:true,runValidators:true});
}
async function unsubscribe(user,endpoint){
 if(typeof endpoint!=='string'||endpoint.length>2048)fail(400,'Invalid browser subscription');
 await PushSubscription.deleteOne({user:user._id,endpoint_hash:crypto.createHash('sha256').update(endpoint).digest('hex')});
}
async function queueNext(){
 const now=new Date(),lease=new Date(+now+30000);
 const record=await Notification.findOneAndUpdate({push_queued_at:null,createdAt:{$gt:new Date(+now-86400000)},$or:[{push_queue_lease:null},{push_queue_lease:{$lt:now}}]},{$set:{push_queue_lease:lease}},{new:true,sort:{createdAt:1}});
 if(!record)return false;
 const subscriptions=record.is_read?[]:await PushSubscription.find({user:record.user,subscribed_at:{$lte:record.createdAt}});
 const payload={id:String(record._id),user_id:String(record.user),title:String(record.title||'New notification').slice(0,120),body:'Open Ballanki A1 Furnitures to view this update.',url:safeLink(record.link)};
 if(subscriptions.length){try{await PushJob.insertMany(subscriptions.map(sub=>({notification:record._id,subscription:sub._id,user:record.user,token_version:sub.token_version,payload,expires_at:new Date(+now+86400000)})),{ordered:false});}catch(error){if(error.code!==11000||error.writeErrors?.some(e=>e.code!==11000))throw error;}}
 await Notification.updateOne({_id:record._id,push_queue_lease:lease},{$set:{push_queued_at:new Date()},$unset:{push_queue_lease:1}});return true;
}
async function deliver(job){
 const [sub,user,notice]=await Promise.all([PushSubscription.findById(job.subscription),User.findById(job.user),Notification.findById(job.notification)]);
 const ownerMatches=sub&&user?.is_active&&String(sub.user)===String(job.user)&&sub.token_version===(user.token_version||0)&&sub.token_version===job.token_version;
 if(!ownerMatches||!notice||notice.is_read){await PushJob.updateOne({_id:job._id},{$set:{status:'cancelled'},$unset:{lease_until:1}});return;}
 try{
  // Revalidate even persisted endpoints, and never log endpoints or encryption keys.
  validateSubscription(sub);
  await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.keys.p256dh,auth:sub.keys.auth}},JSON.stringify(job.payload),{TTL:86400,urgency:'normal',timeout:5000,topic:crypto.createHash('sha256').update(String(job.notification)).digest('base64url').slice(0,24)});
  await PushJob.updateOne({_id:job._id},{$set:{status:'sent'},$unset:{lease_until:1,last_error:1}});
 }catch(error){
  const status=Number(error.statusCode||error.status)||0;
  if(status===404||status===410)await PushSubscription.deleteOne({_id:sub._id,user:job.user,token_version:job.token_version});
  const retry=(!status||status===429||status>=500)&&job.attempts<6;
  await PushJob.updateOne({_id:job._id},{$set:{status:retry?'pending':'failed',last_error:status?'Push service HTTP '+status:'Push delivery unavailable',next_attempt:new Date(Date.now()+Math.min(3600000,10000*2**job.attempts))},$unset:{lease_until:1}});
 }
}
async function processQueue(){
 if(running||!configured())return;running=true;
 try{
  for(let n=0;n<10;n++)if(!await queueNext())break;
  const now=new Date(),jobs=[];
  for(let n=0;n<4;n++){const job=await PushJob.findOneAndUpdate({attempts:{$lt:6},expires_at:{$gt:now},$or:[{status:'pending',next_attempt:{$lte:now}},{status:'sending',lease_until:{$lt:now}}]},{$set:{status:'sending',lease_until:new Date(+now+30000)},$inc:{attempts:1}},{new:true,sort:{createdAt:1}});if(!job)break;jobs.push(job);}
  await Promise.all(jobs.map(deliver));
 }catch(error){console.error('Push queue could not be processed:',error.name);}finally{running=false;}
}
function startWorker(){if(!timer){timer=setInterval(()=>void processQueue(),2000);timer.unref();void processQueue();}}
function stopWorker(){clearInterval(timer);timer=undefined;}
module.exports={configured,safeLink,validateSubscription,subscribe,unsubscribe,queueNext,deliver,processQueue,startWorker,stopWorker};
