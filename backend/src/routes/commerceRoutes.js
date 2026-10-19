const { orderEmail } = require('../lib/emailQueue');
const router=require('express').Router();
const mongoose=require('mongoose');
const crypto=require('crypto');
const Product=require('../models/Product');
const User=require('../models/User');
const {Address,CartItem,Wishlist,Order,Coupon,Notification,ReturnRequest,Offer}=require('../models/Commerce');
const {authenticate,roles}=require('../middleware/auth');
const {asyncRoute:wrap,fail,pick,id,plain,page}=require('../lib/http');
const {split,totals}=require('../lib/preorder');
const {deliveryEstimate}=require('../lib/delivery');
const pricing=require('../lib/deliveryPricing');
router.use(authenticate);
const cart=async user=>{
 const rows=await CartItem.find({user}).populate('product');
 const items=[];for(const row of rows){const p=row.product;if(!p?.is_active||!p?.is_approved)continue;const product=p.toJSON();const offer=await Offer.findOne({customer:user,product:p._id,status:'accepted',used_at:null,expires_at:{$gt:new Date()},listed_price:p.price}).sort({accepted_at:-1});if(offer){product.listed_price=p.price;product.price=offer.price;product.accepted_offer_id=String(offer._id);product.offer_expires_at=offer.expires_at;}items.push({id:String(row._id),product_id:String(p._id),quantity:row.quantity,...split(row.quantity,p.stock_quantity,product.price),product});}
 return {items,subtotal:items.reduce((n,r)=>n+r.product.price*r.quantity,0),item_count:items.reduce((n,r)=>n+r.quantity,0)};
};
router.get('/cart',wrap(async(req,res)=>res.json(await cart(req.user._id))));
router.post('/cart/add',wrap(async(req,res)=>{
 const p=await Product.findOne({_id:id(req.body.product_id),is_active:true,is_approved:true});if(!p)fail(404,'Product is unavailable');
 const qty=Number(req.body.quantity);if(!Number.isInteger(qty)||qty===0||qty < -100||qty>100)fail(400,'Quantity adjustment must be a nonzero integer between -100 and 100');
 const old=await CartItem.findOne({user:req.user._id,product:p._id});const total=(old?.quantity||0)+qty;
 if(total<1||total>100)fail(409,'Requested quantity exceeds available stock');
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
router.post('/orders/quote',wrap(async(req,res)=>{const current=await cart(req.user._id);const {discount}=await discountFor(req.body.coupon_code,current.subtotal);const items=current.items.map(i=>({...i,unit_price:i.product.price,...deliveryEstimate(i.product)}));let address;if(req.body.address_id){address=await Address.findOne({_id:id(req.body.address_id),user:req.user._id});if(!address)fail(400,'Select your saved delivery address');}const delivery=pricing.calculate(await pricing.policy(),items,address?.pincode||req.body.pincode,current.subtotal);res.json({items,delivery_pricing:delivery,...totals(items,discount,delivery.amount)});}));
router.get('/orders/active-coupons',wrap(async(req,res)=>res.json((await Coupon.find({is_active:true})).map(plain))));
router.post('/orders/validate-coupon',wrap(async(req,res)=>{const current=await cart(req.user._id);const result=await discountFor(req.body.code||req.body.coupon_code,current.subtotal);res.json({valid:true,discount_amount:result.discount,coupon:plain(result.coupon)});}));
const orderView=order=>({...plain(order),customer_id:String(order.customer?._id||order.customer),customer:order.customer?.full_name?order.customer.toJSON():undefined});
router.get('/orders/merchant/incoming',roles('merchant','admin'),wrap(async(req,res)=>{const filter=req.user.role==='admin'?{}:{'items.merchant_id':String(req.user._id)};if(req.query.status)filter.status=req.query.status;const orders=await Order.find(filter).populate('customer').sort({createdAt:-1});res.json(page(orders.map(o=>{const v=orderView(o);if(req.user.role!=='admin')v.items=v.items.filter(i=>i.merchant_id===String(req.user._id));return v;}),req.query));}));
router.get('/orders',wrap(async(req,res)=>{const filter={customer:req.user._id};if(req.query.status)filter.status=req.query.status;res.json(page((await Order.find(filter).sort({createdAt:-1})).map(orderView),req.query));}));
router.post('/orders',wrap(async(req,res)=>{
 if(req.body.checkout_mode==='online'&&!require('../lib/razorpay').configured())fail(503,'Online payment is unavailable. Your cart has been kept. Please try again later.');
 const key=String(req.get('Idempotency-Key')||req.body.request_key||'');if(!key||key.length>100)fail(400,'A checkout request key is required');
 const existing=await Order.findOne({customer:req.user._id,request_key:key});if(existing)return res.json(orderView(existing));
 const address=await Address.findOne({_id:id(req.body.address_id),user:req.user._id});if(!address)fail(400,'Select your saved delivery address');
 const rows=await CartItem.find({user:req.user._id});if(!rows.length)fail(400,'Your cart is empty');
 const reservedStock=[],claimedOffers=[];let couponId=null,created=null;
 try{
  const items=[];let subtotal=0;const deliveryBase=new Date();
  for(const row of rows){
   const p=await Product.findOne({_id:row.product,is_active:true,is_approved:true});if(!p)fail(409,'A product in your cart is no longer available');
   const offer=await Offer.findOne({customer:req.user._id,product:p._id,status:'accepted',used_at:null,expires_at:{$gt:new Date()},listed_price:p.price}).sort({accepted_at:-1});
   let ready=0;
   for(let attempt=0;attempt<20;attempt++){
    const fresh=await Product.findOne({_id:p._id,is_active:true,is_approved:true}).select('stock_quantity');if(!fresh)fail(409,'Product is unavailable');
    ready=Math.min(row.quantity,fresh.stock_quantity);if(!ready)break;
    const reserved=await Product.updateOne({_id:p._id,stock_quantity:fresh.stock_quantity,is_active:true,is_approved:true},{$inc:{stock_quantity:-ready}});
    if(reserved.modifiedCount===1){reservedStock.push({product:p._id,quantity:ready});break;}
    if(attempt===19)fail(409,'Stock changed. Please retry checkout.');
   }
   const price=offer?offer.price:p.price;const allocation=split(row.quantity,ready,price);
   items.push({id:String(row._id),product_id:String(p._id),merchant_id:String(p.merchant||''),product_name:p.name,product_image:p.images?.[0]||'',quantity:row.quantity,unit_price:price,total_price:price*row.quantity,...allocation,stock_reserved_quantity:ready,...deliveryEstimate(p,deliveryBase),deposit_rate:20,...(offer?{accepted_offer_id:String(offer._id)}:{})});subtotal+=price*row.quantity;
  }
  if(req.body.expected_allocation){if(!Array.isArray(req.body.expected_allocation)||req.body.expected_allocation.length!==items.length||items.some(i=>!req.body.expected_allocation.some(e=>String(e.product_id)===i.product_id&&e.ready_stock_quantity===i.ready_stock_quantity&&e.preorder_quantity===i.preorder_quantity&&e.unit_price===i.unit_price)))fail(409,'Stock or price changed. Review the updated pre-booking amounts before placing your order.');}
  const {coupon,discount}=await discountFor(req.body.coupon_code,subtotal);const delivery=pricing.calculate(await pricing.policy(),items,address.pincode,subtotal);const shipping=delivery.amount;const calculated=totals(items,discount,shipping);if(req.body.expected_total_amount!==undefined&&Math.round(Number(req.body.expected_total_amount)*100)!==Math.round(calculated.total_amount*100))fail(409,'Delivery charges or order amounts changed. Review checkout again.');const seller=require('../lib/storeSettings').invoiceSeller(await require('../lib/storeSettings').branding());
  if(coupon){const filter={_id:coupon._id,is_active:true};if(coupon.max_uses)filter.used_count={$lt:coupon.max_uses};const used=await Coupon.updateOne(filter,{$inc:{used_count:1}});if(used.modifiedCount!==1)fail(409,'Coupon has reached its use limit');couponId=coupon._id;}
  created=await Order.create({customer:req.user._id,request_key:key,order_number:'BA-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex').toUpperCase(),items,shipping_address:plain(address),invoice_seller:seller,invoice_number:"INV-BA-"+crypto.randomBytes(10).toString("hex").toUpperCase(),delivery_pricing:delivery,subtotal,discount_amount:discount,shipping_amount:shipping,...calculated,coupon_code:coupon?.code,payment_status:'pending',payment_method:require('../lib/razorpay').configured()?'razorpay':'local_pending',status_history:[{status:'pending',timestamp:new Date(),note:'Order saved; payment has not been collected.'}]});
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
 await orderEmail(created,'placed');
 res.status(201).json(orderView(created));
}));
const accessible=async req=>{const order=await Order.findById(id(req.params.id)).populate('customer');if(!order)fail(404,'Order not found');const owner=String(order.customer._id)===String(req.user._id);const merchant=req.user.role==='merchant'&&order.items.some(i=>i.merchant_id===String(req.user._id));if(!owner&&!merchant&&!['admin','support'].includes(req.user.role))fail(403,'You cannot access this order');return order;};
router.get('/orders/:id/invoice',wrap(async(req,res)=>{
 const order=await accessible(req);if(!['admin','support'].includes(req.user.role)&&String(order.customer._id)!==String(req.user._id))fail(403,'Only the customer or store can download this invoice');
 if(!order.invoice_seller){const seller=require('../lib/storeSettings').invoiceSeller(await require('../lib/storeSettings').branding());const snapshot=await Order.findOneAndUpdate({_id:order._id,invoice_seller:null},{$set:{invoice_seller:seller,invoice_number:'INV-'+order.order_number}},{new:true});const saved=snapshot||await Order.findById(order._id);order.invoice_seller=saved.invoice_seller;order.invoice_number=saved.invoice_number;}const pdf=await require('../lib/invoice')(order);
 const filename='invoice-'+String(order.order_number).replace(/[^a-zA-Z0-9_-]/g,'')+'.pdf';
 res.set({'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="'+filename+'"','Cache-Control':'private, no-store'}).send(pdf);
}));
router.get('/orders/:id',wrap(async(req,res)=>{const o=await accessible(req);const v=orderView(o);if(req.user.role==='merchant')v.items=v.items.filter(i=>i.merchant_id===String(req.user._id));res.json(v);}));
const cancelOrder=async order=>{
 const updated=await Order.findOneAndUpdate({_id:order._id,status:{$in:['pending','confirmed']},payment_status:'pending',paid_amount:{$in:[0,null]},payment_active_id:null,$or:[{payment_lock_until:null},{payment_lock_until:{$lte:new Date()}}]},{$set:{status:'cancelled'},$push:{status_history:{status:'cancelled',timestamp:new Date(),note:'Unpaid order cancelled'}}},{new:true});
 if(!updated){const fresh=await Order.findById(order._id);if(fresh?.status==='cancelled')return fresh;fail(409,'Only unpaid orders without an active payment can be cancelled. Check payment status first');}
 for(const item of updated.items){const reserved=item.stock_reserved_quantity??(item.stock_reserved?item.quantity:0);if(reserved)await Product.updateOne({_id:item.product_id},{$inc:{stock_quantity:reserved}});if(item.accepted_offer_id)await Offer.updateOne({_id:item.accepted_offer_id,order_id:updated._id},{$unset:{used_at:1,order_id:1}});}
 if(updated.coupon_code)await Coupon.updateOne({code:updated.coupon_code,used_count:{$gt:0}},{$inc:{used_count:-1}});
 await orderEmail(updated,'cancelled');
 return updated;
};
router.post('/orders/:id/cancel',wrap(async(req,res)=>{const o=await accessible(req);if(req.user.role==='merchant')fail(403,'Ask an administrator to cancel the order');await cancelOrder(o);res.json(orderView(await Order.findById(o._id)));}));
router.post('/orders/:id/ready-for-delivery',roles('admin'),wrap(async(req,res)=>{
 const o=await accessible(req);
 if(!o.has_preorder||o.status!=='processing')fail(409,'Only a pre-booked order being made can be marked ready for delivery.');
 const initial=Math.round((o.amount_due_now??o.total_amount)*100);
 if((o.paid_amount_paise??Math.round((o.paid_amount||0)*100))<initial)fail(409,'The initial payment must be verified first.');
 if(o.balance_released_at)return res.json(orderView(o));
 const updated=await Order.findOneAndUpdate({_id:o._id,status:'processing',balance_released_at:null},{$set:{balance_released_at:new Date(),balance_released_by:req.user._id},$push:{status_history:{status:'ready_for_delivery',timestamp:new Date(),note:'Furniture completed. The customer can now pay the remaining balance before dispatch.'}}},{new:true});
 if(!updated)fail(409,'Order changed. Refresh and try again.');
 await orderEmail(updated,'ready for delivery');res.json(orderView(updated));
}));
router.patch('/orders/:id/status',roles('merchant','admin'),wrap(async(req,res)=>{
 const o=await accessible(req);if(req.user.role==='merchant'&&o.items.some(i=>i.merchant_id!==String(req.user._id)))fail(409,'An administrator must update a multi-merchant order');
 const transitions={pending:['confirmed','cancelled'],confirmed:['processing','cancelled'],processing:['shipped'],shipped:['out_for_delivery','delivered'],out_for_delivery:['delivered'],delivered:[],cancelled:[],refunded:[]};
 const oldDelivery=JSON.stringify([o.tracking_number,o.carrier_name,o.tracking_url,o.current_location,o.notes]);const previousStatus=o.status;const status=req.body.status||o.status;if(status!==o.status&&!transitions[o.status].includes(status))fail(409,'Invalid order status transition');
 if(status!=='cancelled'&&status!==o.status&&(Math.round((o.paid_amount||0)*100)<Math.round((['shipped','out_for_delivery','delivered'].includes(status)?o.total_amount:(o.amount_due_now??o.total_amount))*100)))fail(409,'Collect the required payment before advancing this order');
 if(status==='cancelled')await cancelOrder(o);else{const changes=pick(req.body,['tracking_number','carrier_name','tracking_url','current_location','notes']);for(const [key,value] of Object.entries(changes))if(typeof value!=='string'||value.length>(key==='notes'?2000:500))fail(400,'Invalid delivery details');if(changes.tracking_url)changes.tracking_url=require('../lib/storeSettings').safeUrl(changes.tracking_url);Object.assign(o,changes);o.delivery_updated_at=new Date();if(status!==o.status){o.status=status;o.status_history.push({status,timestamp:new Date(),note:req.body.note||'Fulfillment status updated'});if(status==='delivered')o.delivered_at=new Date();if(status==='shipped')o.dispatch_at=new Date();}await o.save();}
 if(status!==previousStatus&&status!=='cancelled')await orderEmail(o,status);else if(status!=='cancelled'&&oldDelivery!==JSON.stringify([o.tracking_number,o.carrier_name,o.tracking_url,o.current_location,o.notes])){o.status_history.push({status:'delivery_update',timestamp:new Date(),note:'Delivery tracking details updated'});await o.save();await orderEmail(o,'delivery update');}
 res.json(orderView(await Order.findById(o._id)));
}));
router.get('/orders/:id/return',wrap(async(req,res)=>{const o=await accessible(req);res.json(await require('../lib/returns').forOrder(o._id));}));
router.post('/orders/:id/refund',wrap(async(req,res)=>{const o=await accessible(req);if(String(o.customer._id)!==String(req.user._id)&&req.user.role!=='admin')fail(403,'Only the customer can request a return');if(o.status!=='delivered')fail(409,'Returns can be requested after delivery');const r=await require('../lib/returns').request(o,req.body.reason);res.status(201).json(r);}));
router.post('/create-order',wrap(async(req,res)=>res.json(await require('../lib/paymentService').start(id(req.body.order_id),req.user._id))));
router.post('/orders/verify-payment',wrap(async(req,res)=>res.json(orderView(await require('../lib/paymentService').verify(id(req.body.order_id),req.user._id,req.body)))));
router.get('/notifications',wrap(async(req,res)=>{const [rows,unreadCount]=await Promise.all([Notification.find({user:req.user._id}).sort({createdAt:-1}).limit(100),Notification.countDocuments({user:req.user._id,is_read:false})]);res.json({notifications:rows.map(plain),unreadCount});}));
router.put('/notifications/all/read',wrap(async(req,res)=>{await Notification.updateMany({user:req.user._id,is_read:false},{$set:{is_read:true}});res.json({success:true});}));
router.put('/notifications/:id/read',wrap(async(req,res)=>{const n=await Notification.findOneAndUpdate({_id:id(req.params.id),user:req.user._id},{is_read:true},{new:true});if(!n)fail(404,'Notification not found');res.json(plain(n));}));
module.exports=router;module.exports.orderView=orderView;
