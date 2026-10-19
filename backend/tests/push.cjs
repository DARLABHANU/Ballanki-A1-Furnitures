const assert=require('node:assert/strict'),crypto=require('node:crypto'),express=require('express'),jwt=require('jsonwebtoken'),webpush=require('web-push');
const vapid=webpush.generateVAPIDKeys();process.env.VAPID_PUBLIC_KEY=vapid.publicKey;process.env.VAPID_PRIVATE_KEY=vapid.privateKey;process.env.VAPID_SUBJECT='mailto:notifications@example.test';process.env.JWT_SECRET='push-tests-only-secret-never-used-in-production-123456';
const {PushSubscription,PushJob}=require('../src/models/Push'),{Notification}=require('../src/models/Commerce'),User=require('../src/models/User');
const push=require('../src/lib/push');const subs=new Map(),jobs=[],notices=[];let checks=0,version=0,queueRecord=null;
const check=(condition,label)=>{assert.ok(condition,label);checks++;};
const ecdh=crypto.createECDH('prime256v1');ecdh.generateKeys();const keys={p256dh:ecdh.getPublicKey().toString('base64url'),auth:crypto.randomBytes(16).toString('base64url')};
const subscription=(suffix='one')=>({endpoint:'https://fcm.googleapis.com/fcm/send/'+suffix,keys});
const matches=(row,query)=>Object.entries(query).every(([key,value])=>String(row[key])===String(value));
PushSubscription.findOne=async q=>[...subs.values()].find(s=>matches(s,q));PushSubscription.countDocuments=async q=>[...subs.values()].filter(s=>matches(s,q)).length;
PushSubscription.findOneAndUpdate=async(q,u)=>{const old=await PushSubscription.findOne(q);const value={_id:old?._id||String(subs.size+1),...old,...u.$set};subs.set(value.endpoint_hash,value);return value;};
PushSubscription.deleteOne=async q=>{for(const[k,s]of subs)if(matches(s,q))subs.delete(k);};PushSubscription.exists=async q=>!![...subs.values()].find(s=>matches(s,q));PushSubscription.findById=async id=>[...subs.values()].find(s=>s._id===String(id));
User.findById=async id=>({_id:id,role:'customer',is_active:true,token_version:version});
Notification.create=async values=>{const value={_id:'notice-'+(notices.length+1),...values};notices.push(value);return value;};
Notification.findOneAndUpdate=async(q,u)=>queueRecord?{...queueRecord,push_queue_lease:u.$set.push_queue_lease}:null;
Notification.updateOne=async(q,u)=>{if(queueRecord)queueRecord={...queueRecord,...u.$set};};
Notification.findById=async()=>({is_read:false});
PushSubscription.find=async q=>[...subs.values()].filter(s=>String(s.user)===String(q.user)&&s.subscribed_at<=q.subscribed_at.$lte);
PushJob.insertMany=async values=>{jobs.push(...values);};PushJob.updateOne=async(q,u)=>{jobs.push({update:u.$set});};
const app=express();app.use(express.json());app.use('/api/v1',require('../src/routes/pushRoutes'));app.use((e,req,res,next)=>res.status(e.status||500).json({error:e.message}));
const server=app.listen(0,'127.0.0.1',async()=>{
 const base='http://127.0.0.1:'+server.address().port+'/api/v1';
 async function request(path,method='GET',data,user='alice'){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+jwt.sign({user_id:user,type:'access',version},process.env.JWT_SECRET)}:{})},...(data?{body:JSON.stringify(data)}:{})});return {status:response.status,data:await response.json()};}
 try{
  check(push.configured(),'matching VAPID keys configured');const config=await request('/push/config');check(config.status===200&&config.data.public_key===vapid.publicKey,'public configuration');check(!JSON.stringify(config.data).includes(vapid.privateKey),'private key not returned');
  for(const endpoint of ['http://fcm.googleapis.com/fcm/send/x','https://127.0.0.1/x','https://example.com/x','https://fcm.googleapis.com.evil.test/x','https://fcm.googleapis.com:444/x','https://a:b@fcm.googleapis.com/x']){assert.throws(()=>push.validateSubscription({endpoint,keys}),e=>e.status===400);checks++;}
  for(const endpoint of ['https://updates.push.services.mozilla.com/wpush/v2/x','https://web.push.apple.com/Q/x','https://wns.notify.windows.com/x'])check(!!push.validateSubscription({endpoint,keys}),'supported push provider');
  assert.throws(()=>push.validateSubscription({endpoint:subscription().endpoint,keys:{auth:'bad',p256dh:'bad'}}));checks++;
  check(push.safeLink('//evil.test')==='/'&&push.safeLink('/\\evil.test')==='/'&&push.safeLink('/customer/orders/one')==='/customer/orders/one','safe notification links');
  check((await request('/push/subscriptions','POST',{subscription:subscription()},null)).status===401,'sign-in required');
  check((await request('/push/subscriptions','POST',{subscription:subscription()})).status===200,'subscribe');check(subs.size===1,'subscription persisted');
  check((await request('/push/subscriptions','POST',{subscription:subscription()})).status===200&&subs.size===1,'idempotent binding');
  check((await request('/push/test','POST',{})).status===202,'own test queued');check(notices.length===1&&notices[0].user==='alice','test stays with recipient');check((await request('/push/test','POST',{})).status===429,'test rate limit');
  await request('/push/subscriptions','DELETE',{endpoint:subscription().endpoint},'bob');check(subs.size===1,'cannot delete another user subscription');
  await request('/push/subscriptions','POST',{subscription:subscription()},'bob');check([...subs.values()][0].user==='bob'&&subs.size===1,'shared browser rebinds to current account');
  const sub=[...subs.values()][0];queueRecord={_id:'queue-notice',user:'bob',title:'Order saved',message:'Private details',link:'/customer/orders/one',createdAt:new Date(Date.now()+1000),is_read:false};await push.queueNext();check(jobs[0].user==='bob','queue recipient');check(!JSON.stringify(jobs[0].payload).includes('Private details'),'lock-screen payload omits private message');check(!!queueRecord.push_queued_at,'queue state persisted');
  let sends=0;webpush.sendNotification=async()=>{sends++;};const job={_id:'job',subscription:sub._id,user:'bob',token_version:0,notification:'queue-notice',payload:jobs[0].payload,attempts:1};
  await push.deliver(job);check(sends===1&&jobs.at(-1).update.status==='sent','delivery success');
  version=1;await push.deliver(job);check(sends===1&&jobs.at(-1).update.status==='cancelled','signed-out session cannot receive');version=0;
  await push.deliver({...job,user:'alice'});check(sends===1&&jobs.at(-1).update.status==='cancelled','old account cannot receive after browser reassignment');
  webpush.sendNotification=async()=>{throw {statusCode:503};};await push.deliver(job);check(jobs.at(-1).update.status==='pending','temporary failure retries');await push.deliver({...job,attempts:6});check(jobs.at(-1).update.status==='failed','retry count bounded');
  webpush.sendNotification=async()=>{throw {statusCode:410};};await push.deliver(job);check(subs.size===0&&jobs.at(-1).update.status==='failed','expired endpoint removed');
  console.log(`${checks} push API, ownership, endpoint validation, queue, logout, retry and expired-subscription checks passed; provider/database mocked.`);
 }catch(error){console.error(error);process.exitCode=1;}finally{server.close();}
});
