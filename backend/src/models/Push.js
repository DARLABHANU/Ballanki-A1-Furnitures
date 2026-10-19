const mongoose=require('mongoose');const {Schema}=mongoose;
const subscriptions=new Schema({
 user:{type:Schema.Types.ObjectId,required:true,index:true},token_version:{type:Number,required:true},
 endpoint_hash:{type:String,required:true,unique:true},endpoint:{type:String,required:true},
 keys:{p256dh:{type:String,required:true},auth:{type:String,required:true}},
 subscribed_at:{type:Date,required:true},last_seen:{type:Date,default:Date.now}
},{timestamps:true});
subscriptions.index({last_seen:1},{expireAfterSeconds:90*86400});
const jobs=new Schema({
 notification:{type:Schema.Types.ObjectId,required:true},subscription:{type:Schema.Types.ObjectId,required:true},user:{type:Schema.Types.ObjectId,required:true},token_version:Number,
 payload:{type:Schema.Types.Mixed,required:true},status:{type:String,enum:['pending','sending','sent','failed','cancelled'],default:'pending'},attempts:{type:Number,default:0},next_attempt:{type:Date,default:Date.now},lease_until:Date,last_error:String,expires_at:{type:Date,required:true}
},{timestamps:true});
jobs.index({notification:1,subscription:1},{unique:true});jobs.index({status:1,next_attempt:1});jobs.index({expires_at:1},{expireAfterSeconds:0});
module.exports={PushSubscription:mongoose.model('PushSubscription',subscriptions),PushJob:mongoose.model('PushJob',jobs)};
