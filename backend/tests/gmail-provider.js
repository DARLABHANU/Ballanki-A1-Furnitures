const assert=require('node:assert/strict');
process.env.NODE_ENV='production';process.env.LOCAL_EMAIL_OUTBOX='false';
Object.assign(process.env,{GMAIL_CLIENT_ID:'test-client',GMAIL_CLIENT_SECRET:'test-secret',GMAIL_REFRESH_TOKEN:'test-refresh',EMAIL_FROM:'Ballanki A1 Furnitures <ballankia1furnitures@gmail.com>',EMAIL_REPLY_TO:'ballankia1furnitures@gmail.com'});
const originalFetch=global.fetch;let refreshes=0,sends=0,mode='success',lastRaw;
global.fetch=async(url,options)=>{
 if(url==='https://oauth2.googleapis.com/token'){
  refreshes++;const body=new URLSearchParams(options.body);assert.equal(body.get('grant_type'),'refresh_token');assert.equal(body.get('client_secret'),'test-secret');
  if(mode==='invalid_grant')return new Response(JSON.stringify({error:'invalid_grant'}),{status:400});
  return new Response(JSON.stringify({access_token:'access-'+refreshes,expires_in:3600}),{status:200});
 }
 assert.equal(url,'https://gmail.googleapis.com/gmail/v1/users/me/messages/send');assert.match(options.headers.Authorization,/^Bearer access-/);sends++;
 lastRaw=Buffer.from(JSON.parse(options.body).raw,'base64url').toString('utf8');
 if(mode==='expired'){mode='success';return new Response('{}',{status:401});}
 if(mode==='quota')return new Response(JSON.stringify({error:{errors:[{reason:'userRateLimitExceeded'}]}}),{status:403});
 if(mode==='forbidden')return new Response('{}',{status:403});
 if(mode==='outage')throw new Error('Network failed');
 return new Response(JSON.stringify({id:'message-'+sends}),{status:200});
};
async function run(){
 const mail=require('../src/lib/email');const values={to:'customer@example.test',subject:'Price offer ₹500',text:'Your quote is ₹500.\nReply through the website.',key:'test-message'};
 assert.equal(mail.configured(),true);assert.ok((await mail.sendEmail(values)).id);assert.equal(refreshes,1);
 assert.match(lastRaw,/From: Ballanki A1 Furnitures <ballankia1furnitures@gmail.com>/);assert.match(lastRaw,/Reply-To: ballankia1furnitures@gmail.com/);
 assert.equal(Buffer.from(lastRaw.split('\r\n\r\n')[1].replace(/\r\n/g,''),'base64').toString('utf8'),values.text);
 const messageId=lastRaw.match(/Message-ID: (.+)/)[1];await mail.sendEmail(values);assert.equal(refreshes,1);assert.equal(lastRaw.match(/Message-ID: (.+)/)[1],messageId);
 mode='expired';await mail.sendEmail(values);assert.equal(refreshes,2);
 mode='quota';await assert.rejects(mail.sendEmail(values),error=>error.retryable===true);
 mode='forbidden';await assert.rejects(mail.sendEmail(values),error=>error.retryable===false);
 mode='outage';await assert.rejects(mail.sendEmail(values),error=>error.retryable===true);
 mode='success';await assert.rejects(mail.sendEmail({...values,to:'customer@example.test\r\nBcc: other@example.test'}),/Invalid email address/);
 process.env.GMAIL_REFRESH_TOKEN='revoked-token';mode='invalid_grant';await assert.rejects(mail.sendEmail(values),error=>error.retryable===false&&!error.message.includes('test-secret'));
 delete process.env.GMAIL_REFRESH_TOKEN;assert.equal(mail.configured(),false);await assert.rejects(mail.sendEmail(values),error=>error.status===503);
 console.log('PASS: Gmail MIME encoding, token cache/refresh, 401 recovery, quota errors, secret-safe failures and header validation. No real emails sent.');
}
run().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;});
