const router=require('express').Router();const push=require('../lib/push');const {authenticate}=require('../middleware/auth');const {asyncRoute:wrap,fail}=require('../lib/http');const {Notification}=require('../models/Commerce');
const tests=new Map();
router.get('/push/config',(req,res)=>res.json({enabled:push.configured(),public_key:push.configured()?process.env.VAPID_PUBLIC_KEY:null}));
router.use('/push',authenticate);
router.post('/push/subscriptions',wrap(async(req,res)=>{if(!push.configured())fail(503,'Browser notifications are not configured yet');await push.subscribe(req.user,req.body?.subscription);res.json({success:true});}));
router.delete('/push/subscriptions',wrap(async(req,res)=>{await push.unsubscribe(req.user,req.body?.endpoint);res.json({success:true});}));
router.post('/push/test',wrap(async(req,res)=>{
 if(!push.configured())fail(503,'Browser notifications are not configured yet');
 const user=String(req.user._id),now=Date.now();for(const [key,time]of tests)if(now-time>60000)tests.delete(key);
 if(tests.size>=10000||now-(tests.get(user)||0)<30000)fail(429,'Wait 30 seconds before sending another test');
 if(!await require('../models/Push').PushSubscription.exists({user:req.user._id,token_version:req.user.token_version||0}))fail(409,'Enable browser notifications first');
 tests.set(user,now);await Notification.create({user:req.user._id,title:'Browser notifications enabled',message:'Your browser is ready for order and chat updates.',link:req.user.role==='admin'?'/admin/dashboard':'/customer/orders'});res.status(202).json({success:true});
}));
module.exports=router;
