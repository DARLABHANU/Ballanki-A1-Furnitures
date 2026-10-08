const mongoose = require('mongoose');
const schema = new mongoose.Schema({
 email: { type:String,required:true,unique:true,lowercase:true,trim:true }, hashed_password:{type:String,required:function(){return !this.google_sub;},select:false}, google_sub:{type:String,unique:true,sparse:true,select:false}, full_name:{type:String,required:true}, phone:String,
 role:{type:String,enum:['customer','admin','merchant','support'],default:'customer'}, is_active:{type:Boolean,default:true}, is_verified:{type:Boolean,default:false}, is_promoter:{type:Boolean,default:false}, token_version:{type:Number,default:0},
 merchant_profile:{type:mongoose.Schema.Types.Mixed,default:null}, payout_settings:mongoose.Schema.Types.Mixed,
 reset_hash:{type:String,select:false},reset_expires:{type:Date,select:false},reset_attempts:{type:Number,default:0,select:false}
},{timestamps:true});
schema.set('toJSON',{transform:(doc,r)=>{r.id=String(r._id);r.account_number=String(r._id).slice(-8).toUpperCase();r.created_at=r.createdAt;for(const k of ['_id','__v','google_sub','hashed_password','token_version','reset_hash','reset_expires','reset_attempts'])delete r[k];return r;}});
module.exports=mongoose.model('User',schema);
