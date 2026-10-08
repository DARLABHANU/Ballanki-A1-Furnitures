const crypto = require('crypto');
let cached, refreshing;
function settings() {
 return {client_id:process.env.GMAIL_CLIENT_ID,client_secret:process.env.GMAIL_CLIENT_SECRET,refresh_token:process.env.GMAIL_REFRESH_TOKEN};
}
function configured(){return Object.values(settings()).every(Boolean)&&Boolean(process.env.EMAIL_FROM);}
function deliveryError(message,retryable=false){return Object.assign(new Error(message),{retryable});}
async function request(url,options){
 try{return await fetch(url,{...options,signal:AbortSignal.timeout(10000)});}
 catch{throw deliveryError('Gmail service unavailable',true);}
}
async function accessToken(force=false){
 const credentials=settings();
 const fingerprint=crypto.createHash('sha256').update(JSON.stringify(credentials)).digest('hex');
 if(!force&&cached?.fingerprint===fingerprint&&cached.until>Date.now()+60000)return cached.token;
 if(refreshing)return refreshing;
 refreshing=(async()=>{
  const response=await request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...credentials,grant_type:'refresh_token'}).toString()});
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.access_token)throw deliveryError('Gmail authorization failed ('+response.status+'). Check the Gmail OAuth credentials and authorize the sender again.',response.status===429||response.status>=500);
  cached={token:data.access_token,until:Date.now()+(Number(data.expires_in)||3600)*1000,fingerprint};
  return cached.token;
 })().finally(()=>{refreshing=undefined;});
 return refreshing;
}
function address(value){
 if(typeof value!=='string'||/[\r\n]/.test(value))throw deliveryError('Invalid email address');
 const match=value.match(/^(?:[^<>]*<)?([^<>\s]+@[^<>\s]+\.[^<>\s]+)>?$/);
 if(!match)throw deliveryError('Invalid email address');
 return value;
}
function message({to,subject,text,key}){
 const encodedSubject='=?UTF-8?B?'+Buffer.from(String(subject).replace(/[\r\n]/g,' ')).toString('base64')+'?=';
 const body=Buffer.from(String(text),'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n')||'';
 const headers=['From: '+address(process.env.EMAIL_FROM),'To: '+address(to),'Subject: '+encodedSubject,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','Message-ID: <'+crypto.createHash('sha256').update(key).digest('hex')+'@ballanki.local>'];
 if(process.env.EMAIL_REPLY_TO)headers.push('Reply-To: '+address(process.env.EMAIL_REPLY_TO));
 return Buffer.from(headers.join('\r\n')+'\r\n\r\n'+body).toString('base64url');
}
async function sendEmail(values){
 const raw=message(values);
 for(let attempt=0;attempt<2;attempt++){
  const token=await accessToken(attempt===1);
  const response=await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({raw})});
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&attempt===0){cached=undefined;continue;}
  if(!response.ok||!data.id){
   const quota=data.error?.errors?.some(item=>['rateLimitExceeded','userRateLimitExceeded','backendError'].includes(item.reason));
   throw deliveryError('Gmail rejected email ('+response.status+'). Check authorization, API enablement and sending limits.',Boolean(quota)||response.status===429||response.status>=500);
  }
  return {id:data.id};
 }
}
module.exports={configured,sendEmail};
