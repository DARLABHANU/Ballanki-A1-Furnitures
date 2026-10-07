const mongoose=require('mongoose');
const s=new mongoose.Schema({
 name:{type:String,required:true,trim:true},description:String,short_description:String,sku:String,
 price:{type:Number,required:true,min:0.01},base_price:{type:Number,min:0},compare_price:{type:Number,min:0},stock_quantity:{type:Number,min:0,default:0,validate:Number.isInteger},low_stock_threshold:{type:Number,min:0,default:2},
 main_category:{type:String,default:'Living Room'},category:String,subcategory:String,subcategory_slug:String,brand:String,tags:[String],material:String,wood_type:String,fabric:String,dimensions:mongoose.Schema.Types.Mixed,weight_grams:Number,
 fulfillment_type:{type:String,enum:['READY_TO_SHIP','READY_STOCK','MADE_TO_ORDER','CUSTOM_ORDER'],default:'READY_STOCK'},allow_pre_order:{type:Boolean,default:false},manufacturing_duration_days:{type:Number,min:0,default:0},shipping_duration_days:{type:Number,min:0,default:5},deposit_policy:mongoose.Schema.Types.Mixed,
 images:[String],is_active:{type:Boolean,default:true},is_featured:{type:Boolean,default:false},is_approved:{type:Boolean,default:false},merchant:{type:mongoose.Schema.Types.ObjectId,ref:'User'},rating_avg:{type:Number,default:0},rating_count:{type:Number,default:0},total_sold:{type:Number,default:0}
},{timestamps:true});
s.index({is_active:1,is_approved:1,createdAt:-1});s.index({merchant:1});
s.set('toJSON',{transform:(doc,r)=>{r.id=String(r._id);r.merchant_id=r.merchant?String(r.merchant._id||r.merchant):null;r.created_at=r.createdAt;r.updated_at=r.updatedAt;r.category={id:r.main_category,name:r.category||r.main_category,slug:(r.category||r.main_category||'').toLowerCase().replace(/\s+/g,'-')};r.tags=Array.isArray(r.tags)?r.tags:[];r.fulfillment_type=r.fulfillment_type==='READY_TO_SHIP'?'READY_STOCK':r.fulfillment_type;delete r._id;delete r.__v;return r;}});
module.exports=mongoose.model('Product',s);
