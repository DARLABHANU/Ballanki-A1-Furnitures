const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { fail } = require('./http');
const gmail = require('./gmail');
const localMode = () => process.env.LOCAL_EMAIL_OUTBOX === 'true' && process.env.NODE_ENV !== 'production';
const configured = () => localMode() || gmail.configured();
function requireEmail() { if(!configured()) fail(503,'Email delivery is not configured. Please contact the store.'); }
function websiteLink(link = '/') {
 const origin = (process.env.EMAIL_WEBSITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
 const url = new URL(origin);
 if(!['http:','https:'].includes(url.protocol)) throw new Error('Invalid website URL');
 return new URL(link.startsWith('/') && !link.startsWith('//') ? link : '/',url.origin).href;
}
async function sendEmail({to,subject,text,key}) {
 requireEmail();
 if(localMode()) {
  const folder=path.resolve(__dirname,'../../local-outbox');await fs.mkdir(folder,{recursive:true});
  await fs.writeFile(path.join(folder,crypto.createHash('sha256').update(key).digest('hex')+'.json'),JSON.stringify({to,subject,text},null,2));
  return {id:'local-'+key};
 }
 return gmail.sendEmail({to,subject,text,key});
}
module.exports={sendEmail,configured,requireEmail,localMode,websiteLink};
