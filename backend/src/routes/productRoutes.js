const router=require('express').Router();
const Product=require('../models/Product');
const {Review,Order}=require('../models/Commerce');
const {authenticate,roles}=require('../middleware/auth');
const {asyncRoute:wrap,fail,pick,id,plain}=require('../lib/http');
const fields=['name','description','short_description','sku','price','base_price','compare_price','stock_quantity','low_stock_threshold','main_category','subcategory','subcategory_slug','brand','tags','material','wood_type','fabric','dimensions','weight_grams','fulfillment_type','allow_pre_order','manufacturing_duration_days','shipping_duration_days','images','is_active','is_featured'];
const escape=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const normalize=body=>{const p=pick(body,fields);if(p.images!==undefined&&(!Array.isArray(p.images)||p.images.length>5||p.images.some(image=>typeof image!=='string'||!image.trim())))fail(400,'Provide at most 5 valid product image URLs');if(typeof p.tags==='string')p.tags=p.tags.split(',').map(x=>x.trim()).filter(Boolean);if(p.compare_price==='')delete p.compare_price;return p;};
const list=async(req,res,scope={is_active:true,is_approved:true})=>{
 const filter={...scope};const q=req.query;
 if(q.search)filter.$or=['name','description','sku'].map(k=>({[k]:{$regex:escape(q.search),$options:'i'}}));
 if(q.category&&q.category!=='all')filter.$and=[{$or:['main_category','subcategory','category','tags'].map(k=>({[k]:{$regex:escape(q.category).replace(/-/g,' '),$options:'i'}}))}];
 for(const k of ['wood_type','fabric','subcategory'])if(q[k])filter[k]={$regex:escape(q[k]),$options:'i'};
 if(q.min_price||q.max_price){filter.price={};if(Number.isFinite(Number(q.min_price))&&q.min_price)filter.price.$gte=Number(q.min_price);if(Number.isFinite(Number(q.max_price))&&q.max_price)filter.price.$lte=Number(q.max_price);}
 if(q.min_rating)filter.rating_avg={$gte:Number(q.min_rating)||0};
 const n=Math.max(1,parseInt(q.page)||1),size=Math.max(1,Math.min(100,parseInt(q.page_size||q.limit)||20));
 const sort={created_at:'createdAt',price:'price',rating_avg:'rating_avg',total_sold:'total_sold'}[q.sort_by]||'createdAt';
 const [items,total]=await Promise.all([Product.find(filter).sort({[sort]:q.sort_order==='asc'?1:-1}).skip((n-1)*size).limit(size),Product.countDocuments(filter)]);
 res.json({items:items.map(p=>p.toJSON()),total,page:n,page_size:size,pages:Math.max(1,Math.ceil(total/size))});
};
router.get('/categories/all',wrap(async(req,res)=>{const cats=await Product.distinct('main_category',{is_active:true,is_approved:true});res.json(cats.map((name,i)=>({id:i+1,name,slug:name.toLowerCase().replace(/\s+/g,'-')})));}));
router.get('/tags/all',wrap(async(req,res)=>res.json(await Product.distinct('tags',{is_active:true,is_approved:true}))));
router.get('/merchant/my-products',authenticate,roles('admin'),wrap((req,res)=>list(req,res,req.user.role==='admin'?{}:{merchant:req.user._id})));
router.get('/',wrap((req,res)=>list(req,res)));
router.get('/:id/reviews',wrap(async(req,res)=>{const reviews=await Review.find({product:id(req.params.id)}).populate('user','full_name').sort({createdAt:-1});res.json({items:reviews.map(r=>({...plain(r),user_name:r.user?.full_name||'Customer'})),total:reviews.length});}));
router.post('/:id/reviews',authenticate,wrap(async(req,res)=>{
 const p=await Product.findById(id(req.params.id));if(!p)fail(404,'Product not found');
 const purchased=await Order.exists({customer:req.user._id,status:'delivered','items.product_id':String(p._id)});if(!purchased)fail(403,'Reviews are available after delivery of your purchase');
 const review=await Review.create({...pick(req.body,['rating','comment','images']),user:req.user._id,product:p._id});
 const all=await Review.find({product:p._id});p.rating_count=all.length;p.rating_avg=all.reduce((n,r)=>n+r.rating,0)/all.length;await p.save();res.status(201).json(plain(review));
}));
router.get('/:id',wrap(async(req,res)=>{const p=await Product.findOne({_id:id(req.params.id),is_active:true,is_approved:true});if(!p)fail(404,'Product not found');res.json(p);}));
router.post('/',authenticate,roles('admin'),wrap(async(req,res)=>{const p=await Product.create({...normalize(req.body),merchant:req.user._id,is_approved:req.user.role==='admin'});res.status(201).json(p);}));
const owned=async req=>{const p=await Product.findById(id(req.params.id));if(!p)fail(404,'Product not found');if(req.user.role!=='admin'&&String(p.merchant)!==String(req.user._id))fail(403,'This product belongs to another merchant');return p;};
router.put('/:id',authenticate,roles('admin'),wrap(async(req,res)=>{const p=await owned(req);Object.assign(p,normalize(req.body));if(req.user.role!=='admin')p.is_approved=false;await p.save();res.json(p);}));
router.delete('/:id',authenticate,roles('admin'),wrap(async(req,res)=>{const p=await owned(req);p.is_active=false;await p.save();res.json({success:true});}));
module.exports=router;module.exports.list=list;module.exports.normalize=normalize;

