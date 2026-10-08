const { EmailChallenge } = require('../models/Email');
const crypto = require('crypto');
const { fail } = require('./http');
const mail = require('./email');
const hash = value => crypto.createHmac('sha256', process.env.JWT_SECRET).update(value).digest('hex');
async function issue(email,purpose,registration={}) {
 mail.requireEmail();
 const now=new Date(), old=await EmailChallenge.findOne({email,purpose});
 const sameWindow=old?.window_start && now-old.window_start<3600000;
 if(old?.sent_at && now-old.sent_at<60000 || sameWindow && old.send_count>=5) fail(429,'Please wait before requesting another code. Codes can be sent once a minute, up to five times an hour.');
 const code=String(crypto.randomInt(100000,1000000));
 const values={email,purpose,code_hash:hash(code),expires_at:new Date(+now+600000),attempts:0,sent_at:now,window_start:sameWindow?old.window_start:now,send_count:sameWindow?old.send_count+1:1,cleanup_at:new Date(+now+86400000),...registration};
 let record;
 try {
  if(old) record=await EmailChallenge.findOneAndUpdate({_id:old._id,updatedAt:old.updatedAt},{$set:values,$unset:{reset_token_hash:1,reset_token_expires:1}},{new:true});
  else record=await EmailChallenge.create(values);
 }catch(error){if(error.code===11000)fail(429,'A code was just requested. Please wait a minute.');throw error;}
 if(!record)fail(429,'A code was just requested. Please wait a minute.');
 try { await mail.sendEmail({to:email,subject:purpose==='registration'?'Verify your Ballanki account':'Reset your Ballanki password',text:'Your Ballanki A1 Furnitures '+(purpose==='registration'?'verification':'password reset')+' code is: '+code+'\n\nThis code expires in 10 minutes. Do not share it. If you did not request this, ignore this email.',key:'otp-'+record._id+'-'+now.getTime()}); }
 catch { await EmailChallenge.deleteOne({_id:record._id,code_hash:values.code_hash});fail(502,'The email could not be sent. Please try again shortly.'); }
 return record;
}
async function verify(email,purpose,code) {
 if(typeof code!=='string'||!/^\d{6}$/.test(code))fail(400,'Enter the six-digit code.');
 const challenge=await EmailChallenge.findOneAndUpdate({email,purpose,expires_at:{$gt:new Date()},attempts:{$lt:5}},{$inc:{attempts:1}},{new:true}).select('+code_hash +password_hash');
 if(!challenge||challenge.code_hash!==hash(code))fail(400,'Code is invalid or expired. Request a new code if necessary.');
 return challenge;
}
module.exports={issue,verify,hash};
