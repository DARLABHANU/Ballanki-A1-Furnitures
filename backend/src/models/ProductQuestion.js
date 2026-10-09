const mongoose=require('mongoose');
const schema=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true,index:true},user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},question:{type:String,required:true,trim:true,minlength:5,maxlength:1000},answer:{type:String,trim:true,maxlength:2000},answered_by:{type:mongoose.Schema.Types.ObjectId,ref:'User'},answered_at:Date},{timestamps:true});
schema.index({product:1,createdAt:-1});
module.exports=mongoose.model('ProductQuestion',schema);
