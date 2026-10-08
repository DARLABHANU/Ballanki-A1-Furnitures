const mongoose = require('mongoose');
const challenge = new mongoose.Schema({
 email: {type:String,required:true}, purpose:{type:String,enum:['registration','password_reset'],required:true},
 code_hash:{type:String,required:true,select:false}, expires_at:{type:Date,required:true}, attempts:{type:Number,default:0},
 sent_at:Date, window_start:Date, send_count:{type:Number,default:0},
 full_name:String, password_hash:{type:String,select:false},
 reset_token_hash:{type:String,select:false}, reset_token_expires:Date,
 cleanup_at:{type:Date,required:true}
},{timestamps:true});
challenge.index({email:1,purpose:1},{unique:true});
challenge.index({cleanup_at:1},{expireAfterSeconds:0});
const job = new mongoose.Schema({
 key:{type:String,required:true,unique:true}, to:{type:String,required:true}, subject:String, text:String,
 status:{type:String,enum:['pending','sending','sent','failed'],default:'pending'}, attempts:{type:Number,default:0},
 next_attempt:{type:Date,default:Date.now}, lease_until:Date, provider_id:String, last_error:String,
 cleanup_at:{type:Date,default:()=>new Date(Date.now()+7*86400000)}
},{timestamps:true});
job.index({status:1,next_attempt:1});job.index({cleanup_at:1},{expireAfterSeconds:0});
module.exports = { EmailChallenge:mongoose.model('EmailChallenge',challenge), EmailJob:mongoose.model('EmailJob',job) };
