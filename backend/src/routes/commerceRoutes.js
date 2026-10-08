const router=require('express').Router();
const mongoose=require('mongoose');
const crypto=require('crypto');
const Product=require('../models/Product');
const User=require('../models/User');
const {Address,CartItem,Wishlist,Order,Coupon,Notification,ReturnRequest,Offer}=require('../models/Commerce');
const {authenticate,roles}=require('../middleware/auth');
const {asyncRoute:wrap,fail,pick,id,plain,page}=require('../lib/http');
router.use(authenticate);
const cart=async user=>{
 const rows=await CartItem.find({user}).populate('product');
 const items=[];for(const row of rows){const p=row.product;if(!p?.is_active||!p?.is_approved)continue;const product=p.toJSON();const offer=await Offer.findOne({customer:user,product:p._id,status:'accepted',used_at:null,expires_at:{$gt:new Date()},listed_price:p.price}).sort({accepted_at:-1});if(offer){product.listed_price=p.price;product.price=offer.price;product.accepted_offer_id=String(offer._id);product.offer_expires_at=offer.expires_at;}items.push({id:String(row._id),product_id:String(p._id),quantity:row.quantity,product});}
 return {items,subtotal:items.reduce((n,r)=>n+r.product.price*r.quantity,0),item_count:items.reduce((n,r)=>n+r.quantity,0)};
};
router.get('/cart',wrap(async(req,res)=>res.json(await cart(req.user._id))));
router.post('/cart/add',wrap(async(req,res)=>{
 const p=await Product.findOne({_id:id(req.body.product_id),is_active:true,is_approved:true});if(!p)fail(404,'Product is unavailable');
 const qty=Number(req.body.quantity);if(!Number.isInteger(qty)||qty===0||qty < -100||qty>100)fail(400,'Quantity adjustment must be a nonzero integer between -100 and 100');
 const old=await CartItem.findOne({user:req.user._id,product:p._id});const total=(old?.quantity||0)+qty;
 if(total<1||total>100||(!p.allow_pre_order&&total>p.stock_quantity))fail(409,'Requested quantity exceeds available stock');
 if(old){const result=await CartItem.updateOne({_id:old._id,quantity:old.quantity},{$set:{quantity:total}},{runValidators:true});if(!result.modifiedCount)fail(409,'Cart changed. Please retry.');}else{await CartItem.create({user:req.user._id,product:p._id,quantity:qty});}res.json(await cart(req.user._id));
}));
router.delete('/cart/:id',wrap(async(req,res)=>{await CartItem.deleteOne({_id:id(req.params.id),user:req.user._id});res.json(await cart(req.user._id));}));
router.delete('/cart',wrap(async(req,res)=>{await CartItem.deleteMany({user:req.user._id});res.json(await cart(req.user._id));}));
router.get('/wishlist',wrap(async(req,res)=>{const rows=await Wishlist.find({user:req.user._id}).populate('product');const items=rows.filter(r=>r.product?.is_active&&r.product?.is_approved).map(r=>r.product.toJSON());res.json({items,product_ids:items.map(p=>p.id)});}));
router.post('/wishlist/toggle',wrap(async(req,res)=>{const product=id(req.body.product_id);const p=await Product.exists({_id:product,is_active:true,is_approved:true});if(!p)fail(404,'Product is unavailable');const filter={user:req.user._id,product};const removed=await Wishlist.findOneAndDelete(filter);if(!removed)await Wishlist.create(filter);res.json({wishlisted:!removed});}));
router.get('/addresses',wrap(async(req,res)=>res.json({items:(await Address.find({user:req.user._id})).map(plain)})));
const addressFields=['label','full_name','phone','line1','line2','city','state','pincode','country','is_default'];
router.post('/addresses',wrap(async(req,res)=>{const a=await Address.create({...pick(req.body,addressFields),user:req.user._id});res.status(201).json(plain(a));}));
router.put('/addresses/:id',wrap(async(req,res)=>{const a=await Address.findOneAndUpdate({_id:id(req.params.id),user:req.user._id},{$set:pick(req.body,addressFields)},{new:true,runValidators:true});if(!a)fail(404,'Address not found');res.json(plain(a));}));
router.delete('/addresses/:id',wrap(async(req,res)=>{await Address.deleteOne({_id:id(req.params.id),user:req.user._id});res.json({success:true});}));
const discountFor=async(code,subtotal,session)=>{
 if(!code)return {coupon:null,discount:0};
 const coupon=await Coupon.findOne({code:String(code).toUpperCase(),is_active:true}).session(session||null);const now=new Date();
 if(!coupon||(coupon.valid_from&&coupon.valid_from>now)||(coupon.valid_until&&coupon.valid_until<now)||(coupon.max_uses&&coupon.used_count>=coupon.max_uses)||subtotal<coupon.min_order_amount)fail(400,'Coupon is invalid, expired, or its minimum order amount is not met');
 let discount=coupon.discount_type==='percentage'?subtotal*(coupon.discount_value||0)/100:(coupon.discount_value??coupon.discount_amount);
 if(coupon.max_discount_amount)discount=Math.min(discount,coupon.max_discount_amount);
 return {coupon,discount:Math.round(Math.min(subtotal,discount)*100)/100};
};
router.get('/orders/active-coupons',wrap(async(req,res)=>res.json((await Coupon.find({is_active:true})).map(plain))));
router.post('/orders/validate-coupon',wrap(async(req,res)=>{const current=await cart(req.user._id);const result=await discountFor(req.body.code||req.body.coupon_code,current.subtotal);res.json({valid:true,discount_amount:result.discount,coupon:plain(result.coupon)});}));
const orderView=order=>({...plain(order),customer_id:String(order.customer?._id||order.customer),customer:order.customer?.full_name?order.customer.toJSON():undefined});
router.get('/orders/merchant/incoming',roles('merchant','admin'),wrap(async(req,res)=>{const filter=req.user.role==='admin'?{}:{'items.merchant_id':String(req.user._id)};if(req.query.status)filter.status=req.query.status;const orders=await Order.find(filter).populate('customer').sort({createdAt:-1});res.json(page(orders.map(o=>{const v=orderView(o);if(req.user.role!=='admin')v.items=v.items.filter(i=>i.merchant_id===String(req.user._id));return v;}),req.query));}));
router.get('/orders',wrap(async(req,res)=>{const filter={customer:req.user._id};if(req.query.status)filter.status=req.query.status;res.json(page((await Order.find(filter).sort({createdAt:-1})).map(orderView),req.query));}));
router.post('/orders',wrap(async(req,res)=>{
 const key=String(req.get('Idempotency-Key')||req.body.request_key||'');if(!key||key.length>100)fail(400,'A checkout request key is required');
 const existing=await Order.findOne({customer:req.user._id,request_key:key});if(existing)return res.json(orderView(existing));
 const address=await Address.findOne({_id:id(req.body.address_id),user:req.user._id});if(!address)fail(400,'Select your saved delivery address');
 const rows=await CartItem.find({user:req.user._id});if(!rows.length)fail(400,'Your cart is empty');
 const reservedStock=[],claimedOffers=[];let couponId=null,created=null;
 try{
  const items=[];let subtotal=0;
  for(const row of rows){
   const p=await Product.findOne({_id:row.product,is_active:true,is_approved:true});if(!p)fail(409,'A product in your cart is no longer available');
   const offer=await Offer.findOne({customer:req.user._id,product:p._id,status:'accepted',used_at:null,expires_at:{$gt:new Date()},listed_price:p.price}).sort({accepted_at:-1});
   if(!p.allow_pre_order){const reserved=await Product.updateOne({_id:p._id,stock_quantity:{$gte:row.quantity}},{$inc:{stock_quantity:-row.quantity}});if(reserved.modifiedCount!==1)fail(409,'Insufficient stock for '+p.name);reservedStock.push({product:p._id,quantity:row.quantity});}
   const price=offer?offer.price:p.price;items.push({id:String(row._id),product_id:String(p._id),merchant_id:String(p.merchant||''),product_name:p.name,product_image:p.images?.[0]||'',quantity:row.quantity,unit_price:price,total_price:price*row.quantity,stock_reserved:!p.allow_pre_order,...(offer?{accepted_offer_id:String(offer._id)}:{})});subtotal+=price*row.quantity;
  }
  const {coupon,discount}=await discountFor(req.body.coupon_code,subtotal);const shipping=subtotal>=100000?0:1500;
  if(coupon){const filter={_id:coupon._id,is_active:true};if(coupon.max_uses)filter.used_count={$lt:coupon.max_uses};const used=await Coupon.updateOne(filter,{$inc:{used_count:1}});if(used.modifiedCount!==1)fail(409,'Coupon has reached its use limit');couponId=coupon._id;}
  created=await Order.create({customer:req.user._id,request_key:key,order_number:'BA-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase(),items,shipping_address:plain(address),subtotal,discount_amount:discount,shipping_amount:shipping,total_amount:Math.round((subtotal-discount+shipping)*100)/100,coupon_code:coupon?.code,payment_status:'pending',payment_method:'local_pending',status_history:[{status:'pending',timestamp:new Date(),note:'Order saved; payment has not been collected.'}]});
  for(const item of items)if(item.accepted_offer_id){const claim=await Offer.updateOne({_id:item.accepted_offer_id,status:'accepted',used_at:null,expires_at:{$gt:new Date()}},{$set:{used_at:new Date(),order_id:created._id}});if(claim.modifiedCount!==1)fail(409,'An accepted offer was already used. Refresh your cart and try again.');claimedOffers.push(item.accepted_offer_id);}
  await CartItem.deleteMany({_id:{$in:rows.map(r=>r._id)},user:req.user._id});
  await Notification.create({user:req.user._id,title:'Order saved',message:created.order_number+' — payment pending',link:'/customer/orders/'+created._id});
 }catch(error){
  if(created)await Order.deleteOne({_id:created._id}).catch(()=>{});
  if(claimedOffers.length)await Offer.updateMany({_id:{$in:claimedOffers},order_id:created?._id},{$unset:{used_at:1,order_id:1}}).catch(()=>{});
  for(const stock of reservedStock)await Product.updateOne({_id:stock.product},{$inc:{stock_quantity:stock.quantity}}).catch(()=>{});
  if(couponId)await Coupon.updateOne({_id:couponId,used_count:{$gt:0}},{$inc:{used_count:-1}}).catch(()=>{});
  if(error.code===11000){const duplicate=await Order.findOne({customer:req.user._id,request_key:key});if(duplicate)return res.json(orderView(duplicate));}
  throw error;
 }
 res.status(201).json(orderView(created));
}));
const accessible=async req=>{const order=await Order.findById(id(req.params.id)).populate('customer');if(!order)fail(404,'Order not found');const owner=String(order.customer._id)===String(req.user._id);const merchant=req.user.role==='merchant'&&order.items.some(i=>i.merchant_id===String(req.user._id));if(!owner&&!merchant&&!['admin','support'].includes(req.user.role))fail(403,'You cannot access this order');return order;};
router.get('/orders/:id',wrap(async(req,res)=>{const o=await accessible(req);const v=orderView(o);if(req.user.role==='merchant')v.items=v.items.filter(i=>i.merchant_id===String(req.user._id));res.json(v);}));
const cancelOrder=async order=>{
 const updated=await Order.findOneAndUpdate({_id:order._id,status:{$in:['pending','confirmed']},payment_status:'pending'},{$set:{status:'cancelled'},$push:{status_history:{status:'cancelled',timestamp:new Date(),note:'Unpaid order cancelled'}}},{new:true});
 if(!updated){const fresh=await Order.findById(order._id);if(fresh?.status==='cancelled')return fresh;fail(409,'Only unpaid orders awaiting processing can be cancelled');}
 for(const item of updated.items){if(item.stock_reserved)await Product.updateOne({_id:item.product_id},{$inc:{stock_quantity:item.quantity}});if(item.accepted_offer_id)await Offer.updateOne({_id:item.accepted_offer_id,order_id:updated._id},{$unset:{used_at:1,order_id:1}});}
 if(updated.coupon_code)await Coupon.updateOne({code:updated.coupon_code,used_count:{$gt:0}},{$inc:{used_count:-1}});
 return updated;
};
router.post('/orders/:id/cancel',wrap(async(req,res)=>{const o=await accessible(req);if(req.user.role==='merchant')fail(403,'Ask an administrator to cancel the order');await cancelOrder(o);res.json(orderView(await Order.findById(o._id)));}));
router.patch('/orders/:id/status',roles('merchant','admin'),wrap(async(req,res)=>{
 const o=await accessible(req);if(req.user.role==='merchant'&&o.items.some(i=>i.merchant_id!==String(req.user._id)))fail(409,'An administrator must update a multi-merchant order');
 const transitions={pending:['confirmed','cancelled'],confirmed:['processing','cancelled'],processing:['shipped'],shipped:['out_for_delivery','delivered'],out_for_delivery:['delivered'],delivered:[],cancelled:[],refunded:[]};
 const status=req.body.status||o.status;if(status!==o.status&&!transitions[o.status].includes(status))fail(409,'Invalid order status transition');
 if(status==='cancelled')await cancelOrder(o);else{Object.assign(o,pick(req.body,['tracking_number','current_location','notes']));if(status!==o.status){o.status=status;o.status_history.push({status,timestamp:new Date(),note:req.body.note||'Fulfillment status updated'});if(status==='delivered')o.delivered_at=new Date();}await o.save();}
 res.json(orderView(await Order.findById(o._id)));
}));
router.post('/orders/:id/refund',wrap(async(req,res)=>{const o=await accessible(req);if(String(o.customer._id)!==String(req.user._id)&&req.user.role!=='admin')fail(403,'Only the customer can request a return');if(o.status!=='delivered')fail(409,'Returns can be requested after delivery');const r=await ReturnRequest.create({user:o.customer._id,order_id:o._id,reason:String(req.body.reason||'Return requested')});res.status(201).json(plain(r));}));
for(const url of ['/create-order','/orders/verify-payment'])router.post(url,(req,res)=>res.status(409).json({error:'Local checkout saves orders with payment pending. Online payment collection is disabled.'}));
router.get('/notifications',wrap(async(req,res)=>{const [rows,unreadCount]=await Promise.all([Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(100),Notification.countDocuments({user:req.user._id,is_read:false})]);res.json({notifications:rows.map(plain),unreadCount});}));
router.put('/notifications/all/read',wrap(async(req,res)=>{await Notification.updateMany({user:req.user._id,is_read:false},{$set:{is_read:true}});res.json({success:true});}));
router.put('/notifications/:id/read',wrap(async(req,res)=>{const n=await Notification.findOneAndUpdate({_id:id(req.params.id),user:req.user._id},{is_read:true},{new:true});if(!n)fail(404,'Notification not found');res.json(plain(n));}));
module.exports=router;module.exports.orderView=orderView;
