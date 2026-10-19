const assert=require('node:assert/strict'),express=require('express'),jwt=require('jsonwebtoken');
process.env.JWT_SECRET='chat-routing-regression-secret-1234567890';
const User=require('../src/models/User'),Product=require('../src/models/Product');
const {Conversation,Offer,Notification}=require('../src/models/Commerce');
const customer='111111111111111111111111',oldAdmin='222222222222222222222222',owner='333333333333333333333333',stranger='444444444444444444444444',cid='555555555555555555555555',pid='666666666666666666666666';
const users=[{_id:customer,role:'customer'},{_id:oldAdmin,role:'admin'},{_id:owner,role:'admin'},{_id:stranger,role:'customer'}].map(u=>({...u,is_active:true,token_version:0,full_name:u.role}));
const c={_id:cid,customer,merchant:oldAdmin,product:pid,status:'open',messages:[],save:async()=>{}};
const query=value=>({select:async()=>value,sort:()=>({limit:async()=>value})});
User.findById=id=>{const u=users.find(u=>u._id===String(id));return {...u,then:resolve=>Promise.resolve(u).then(resolve),select:async()=>u};};
User.find=filter=>query(users.filter(u=>u.role===filter.role&&u.is_active===filter.is_active));
Product.findById=()=>query({_id:pid,name:'Chair',price:100,images:[]});
Conversation.findById=async()=>c;let inboxFilter;Conversation.find=f=>{inboxFilter=f;return query([c]);};
Offer.find=()=>({sort:async()=>[]});
Product.findOne=async()=>({_id:pid,name:'Chair',price:100,merchant:oldAdmin});
Offer.updateMany=async()=>{};Offer.findOne=()=>({sort:async()=>null});
let lastOffer;
Offer.create=async values=>(lastOffer={_id:'777777777777777777777777',...values,status:'pending',save:async()=>{}});
Offer.findById=async()=>lastOffer;

const notices=[];Notification.create=async value=>{notices.push(value);return {_id:'notice',...value};};
require('../src/lib/emailQueue').notifyUser=async()=>{};
const app=express();app.use(express.json());app.use(require('../src/routes/serviceRoutes'));app.use((e,req,res,next)=>res.status(e.status||500).json({error:e.message}));
const server=app.listen(0,'127.0.0.1',async()=>{
const request=async(user,path,body)=>{const r=await fetch('http://127.0.0.1:'+server.address().port+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+jwt.sign({user_id:user,type:'access',version:0},process.env.JWT_SECRET)},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};
try{
 assert.equal((await request(customer,`/conversations/${cid}/messages`,{content:'Is this available?'})).status,201);
 assert.deepEqual(notices.map(n=>String(n.user)).sort(),[oldAdmin,owner].sort());
 assert.ok(notices.every(n=>n.link===`/admin/enquiries?conversation=${cid}`));
 assert.equal((await request(owner,'/admin/conversations')).status,200);assert.deepEqual(inboxFilter,{});
 notices.length=0;
 assert.equal((await request(owner,`/conversations/${cid}/messages`,{content:'Yes, it is.'})).status,201);
 assert.equal(c.messages.at(-1).sender_type,'MERCHANT');assert.equal(notices.length,1);assert.equal(String(notices[0].user),customer);assert.equal(notices[0].link,`/customer/products/${pid}?negotiate=1`);
 assert.equal((await request(stranger,`/conversations/${cid}/messages`,{content:'Intrusion'})).status,403);
 assert.equal(notices.length,1);assert.equal((await request(customer,'/admin/conversations')).status,403);
 assert.equal((await request(customer,`/conversations/${cid}/messages`,{content:' '})).status,400);
 notices.length=0;
 assert.equal((await request(owner,`/conversations/${cid}/offers`,{proposed_price:90})).status,201);
 assert.equal(lastOffer.offered_by,'merchant');assert.equal(String(notices[0].user),customer);
 notices.length=0;
 assert.equal((await request(customer,`/conversations/offers/${lastOffer._id}/reject`,{})).status,200);
 assert.deepEqual(notices.map(n=>String(n.user)).sort(),[oldAdmin,owner].sort());
 console.log('Chat regression passed: both active admins notified, shared owner inbox, replacement owner reply, customer-only reply notification, private links and unauthorized access blocked. Database/email mocked; no live messages sent.');
}catch(e){console.error(e);process.exitCode=1;}finally{server.close();}
});
