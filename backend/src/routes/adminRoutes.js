const router=require('express').Router();
const bcrypt=require('bcryptjs');
const User=require('../models/User');const Product=require('../models/Product');
const {Order,Coupon,Setting,ReturnRequest,Review,Audit}=require('../models/Commerce');
const {authenticate,roles}=require('../middleware/auth');const {asyncRoute:wrap,fail,pick,id,plain,page}=require('../lib/http');
const {orderView}=require('./commerceRoutes');
router.use(authenticate,roles('admin'));
router.get('/products',wrap((req,res)=>require('./productRoutes').list(req,res,{})));
router.patch('/products/:id/approve',wrap(async(req,res)=>{if(typeof req.body.is_approved!=='boolean')fail(400,'Approval must be true or false');const p=await Product.findByIdAndUpdate(id(req.params.id),{is_approved:req.body.is_approved},{new:true});if(!p)fail(404,'Product not found');res.json(p);}));
router.delete('/products/:id',wrap(async(req,res)=>{const p=await Product.findByIdAndUpdate(id(req.params.id),{is_active:false},{new:true});if(!p)fail(404,'Product not found');res.json({success:true});}));
router.get('/dashboard',wrap(async(req,res)=>{
 const now=new Date();const range=['month','last_month','year'].includes(req.query.range)?req.query.range:'month';
 let start,end,bucket='day';
 if(range==='year'){start=new Date(Date.UTC(now.getUTCFullYear(),0,1));end=new Date(Date.UTC(now.getUTCFullYear()+1,0,1));bucket='month';}
 else if(range==='last_month'){start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1));end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));}
 else{start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1));}
 const dateKey=d=>bucket==='month'?d.toISOString().slice(0,7):d.toISOString().slice(0,10);
 const points=[];for(let d=new Date(start);d<end;d=bucket==='month'?new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)):new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1))){points.push({key:dateKey(d),label:bucket==='month'?d.toLocaleString('en-IN',{month:'short',timeZone:'UTC'}):String(d.getUTCDate()),revenue:0});}
 const couponFilter={is_active:true,$and:[{$or:[{valid_from:{$exists:false}},{valid_from:null},{valid_from:{$lte:now}}]},{$or:[{valid_until:{$exists:false}},{valid_until:null},{valid_until:{$gte:now}}]},{$or:[{max_uses:{$exists:false}},{max_uses:null},{max_uses:0},{$expr:{$lt:['$used_count','$max_uses']}}]}]};
 const [totalUsers,totalCustomers,totalProducts,totalPromoters,totalOrders,totalRevenue,pendingOrders,activeCoupons,recentOrders,statusRows,paidRows,paidOrders,topProducts]=await Promise.all([
  User.countDocuments({role:{$ne:'merchant'}}),User.countDocuments({role:'customer'}),Product.countDocuments({is_active:true,is_approved:true}),User.countDocuments({is_promoter:true,is_active:{$ne:false}}),Order.countDocuments(),Order.aggregate([{$match:{payment_status:'paid'}},{$group:{_id:null,total:{$sum:'$total_amount'}}}]),Order.countDocuments({status:'pending'}),Coupon.countDocuments(couponFilter),Order.find().populate('customer').sort({createdAt:-1}).limit(6),Order.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]),Order.find({payment_status:'paid',createdAt:{$gte:start,$lt:end}}).select('createdAt total_amount'),Order.countDocuments({payment_status:'paid'}),Order.aggregate([{$match:{createdAt:{$gte:start,$lt:end},status:{$ne:'cancelled'}}},{$unwind:'$items'},{$group:{_id:'$items.product_id',name:{$first:'$items.product_name'},quantity:{$sum:'$items.quantity'},order_value:{$sum:'$items.total_price'}}},{$sort:{quantity:-1,order_value:-1}},{$limit:5}])
 ]);
 const daily=new Map(points.map(point=>[point.key,point]));for(const order of paidRows){const point=daily.get(dateKey(order.createdAt));if(point)point.revenue+=Number(order.total_amount||0);}
 res.json({range,total_users:totalUsers,total_customers:totalCustomers,total_products:totalProducts,total_promoters:totalPromoters,total_orders:totalOrders,total_revenue:Number(totalRevenue[0]?.total||0),paid_orders:paidOrders,pending_orders:pendingOrders,active_coupons:activeCoupons,recent_orders:recentOrders.map(orderView),order_statuses:statusRows.map(row=>({status:row._id,count:row.count})),sales_points:points,top_products:topProducts.map(row=>({product_id:row._id?String(row._id):null,name:row.name||'Product',quantity:row.quantity,order_value:row.order_value}))});
}));
router.get('/users',wrap(async(req,res)=>{let users=await User.find({role:{$ne:'merchant'}}).sort({createdAt:-1});if(req.query.role)users=users.filter(u=>req.query.role==='promoter'?u.is_promoter:u.role===req.query.role);if(req.query.search){const q=String(req.query.search).toLowerCase();users=users.filter(u=>(u.full_name+' '+u.email).toLowerCase().includes(q));}res.json(page(users.map(u=>u.toJSON()),req.query));}));
router.get('/users/:id',wrap(async(req,res)=>{const u=await User.findById(id(req.params.id));if(!u)fail(404,'User not found');res.json(u);}));
router.post('/users',wrap(async(req,res)=>{if(req.body.role==='merchant')fail(409,'Merchant accounts are no longer supported');if(typeof req.body.password!=='string'||req.body.password.length<8)fail(400,'Password requires at least 8 characters');const u=await User.create({...pick(req.body,['email','full_name','role','is_promoter','phone']),hashed_password:await bcrypt.hash(req.body.password,12)});res.status(201).json(u);}));
router.patch('/users/:id',wrap(async(req,res)=>{
 if(req.body.role==='merchant')fail(409,'Merchant accounts are no longer supported');
 const u=await User.findById(id(req.params.id));if(!u)fail(404,'User not found');if(String(u._id)===String(req.user._id)&&(req.body.is_active===false||(req.body.role&&req.body.role!=='admin')))fail(409,'You cannot remove your own administrator access');
 const changes=pick(req.body,['full_name','phone','role','is_active','is_promoter']);if(changes.role==='promoter'){changes.role='customer';changes.is_promoter=true;}
 Object.assign(u,changes);if(u.role==='merchant'&&!u.merchant_profile)u.merchant_profile={business_name:u.full_name+' Store',commission_rate:0,is_approved:true};if(changes.role||changes.is_active!==undefined)u.token_version+=1;await u.save();res.json(u);
}));
router.delete('/users/:id',wrap(async(req,res)=>{if(id(req.params.id)===String(req.user._id))fail(409,'You cannot deactivate your own account');const u=await User.findByIdAndUpdate(req.params.id,{$set:{is_active:false},$inc:{token_version:1}},{new:true});if(!u)fail(404,'User not found');res.json({success:true});}));
router.get('/orders',wrap(async(req,res)=>{const filter={};if(req.query.status)filter.status=req.query.status;let orders=await Order.find(filter).populate('customer').sort({createdAt:-1});if(req.query.search)orders=orders.filter(o=>o.order_number.includes(String(req.query.search)));res.json(page(orders.map(orderView),req.query));}));
router.get('/orders/:id',wrap(async(req,res)=>{const order=await Order.findById(id(req.params.id)).populate('customer');if(!order)fail(404,'Order not found');res.json(orderView(order));}));
router.delete('/orders/:id',(req,res)=>res.status(409).json({error:'Order records are retained for audit. Cancel an unpaid order from its details instead.'}));
const couponFields=['code','description','discount_type','discount_value','discount_amount','max_discount_amount','promoter_id','promoter_commission','platform_profit','min_order_amount','max_uses','is_active','valid_from','valid_until'];
const couponBody=body=>{const c=pick(body,couponFields);if(c.discount_type==='percentage'&&(c.discount_value<0||c.discount_value>100))fail(400,'Percentage must be between 0 and 100');if(c.promoter_id==='')delete c.promoter_id;return c;};
router.get('/coupons',wrap(async(req,res)=>res.json(page((await Coupon.find().sort({createdAt:-1})).map(plain),{...req.query,page_size:100}))));
router.post('/coupons',wrap(async(req,res)=>{const data=couponBody(req.body);if(data.promoter_id&&!await User.exists({_id:id(data.promoter_id),is_promoter:true}))fail(400,'Select an active promoter account');const c=await Coupon.create(data);res.status(201).json(plain(c));}));
router.patch('/coupons/:id',wrap(async(req,res)=>{const c=await Coupon.findByIdAndUpdate(id(req.params.id),{$set:couponBody(req.body)},{new:true,runValidators:true});if(!c)fail(404,'Coupon not found');res.json(plain(c));}));
router.delete('/coupons/:id',wrap(async(req,res)=>{await Coupon.findByIdAndUpdate(id(req.params.id),{is_active:false});res.json({success:true});}));
router.get('/analytics/sales',wrap(async(req,res)=>{
 const orders=await Order.find({payment_status:'paid'});const daily={};for(const o of orders){const date=o.createdAt.toISOString().slice(0,10);daily[date]=(daily[date]||0)+o.total_amount;}res.json({total_revenue:orders.reduce((n,o)=>n+o.total_amount,0),total_orders:orders.length,total_platform_fee:0,daily_sales:Object.entries(daily).map(([date,revenue])=>({date,revenue})),sales:Object.entries(daily).map(([date,revenue])=>({date,revenue})),category_sales:[]});
}));
for(const key of ['settings','website-settings']){
 router.get('/'+key,wrap(async(req,res)=>res.json((await Setting.findOne({key}))?.value||{})));
 router.put('/'+key,wrap(async(req,res)=>{const fields=key==='settings'?['platformMargin','promoterDiscount','promoterCommission','platformProfit','supportEmail','supportPhone']:['siteName','footerText','seoTitle','seoMeta'];const value=pick(req.body,fields);await Setting.findOneAndUpdate({key},{$set:{value}},{upsert:true});res.json(value);}));
}
router.get('/return-requests',wrap(async(req,res)=>res.json(page((await ReturnRequest.find().populate('order_id').sort({createdAt:-1})).map(r=>({...plain(r),order:r.order_id?orderView(r.order_id):null})),req.query))));
router.patch('/return-requests/:id/approval',wrap(async(req,res)=>{if(!['approved','rejected'].includes(req.body.status))fail(400,'Invalid return decision');const r=await ReturnRequest.findOneAndUpdate({_id:id(req.params.id),status:'pending'},{$set:pick(req.body,['status','admin_notes'])},{new:true});if(!r)fail(409,'Return is missing or already processed');res.json(plain(r));}));
router.post('/return-requests/:id/complete',(req,res)=>res.status(409).json({error:'Refunds require a configured payment provider. Local orders have no collected payment.'}));
router.delete('/return-requests/:id',(req,res)=>res.status(409).json({error:'Return records are retained for audit. Approve or reject the request instead.'}));
// Local orders are unpaid, so they never create earned commissions or settlements.
for(const resource of ['commissions','withdrawals','settlements']){
 router.get('/'+resource,wrap(async(req,res)=>{const rows=await Setting.find({key:{$regex:'^ledger:'+resource+':'}});res.json({...page(rows.map(r=>r.value),req.query),total_platform_earnings:0,total_seller_commission:0,total_promoter_profit:0,pending_payouts:0});}));
 for(const action of ['pay','approval'])router.patch('/'+resource+'/:id/'+action,(req,res)=>res.status(409).json({error:'No payable balance exists for local unpaid orders. Payment settlement is disabled.'}));
 router.delete('/'+resource+'/:id',(req,res)=>res.status(409).json({error:'Financial audit records cannot be deleted.'}));
}
router.get('/wallets',wrap(async(req,res)=>res.json({items:(await User.find({role:'merchant'})).map(u=>({user_id:String(u._id),full_name:u.full_name,available_balance:0,total_withdrawn:0}))})));
router.post('/marketing/broadcast',(req,res)=>res.status(503).json({error:'Broadcast email is not configured. No messages were sent.'}));
module.exports=router;
