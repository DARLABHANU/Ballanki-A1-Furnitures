const {Setting}=require('../models/Commerce');
const {fail}=require('./http');
const KEY='homepage:promotions',FIXED='ballanki-permanent';
const defaultBanner={id:FIXED,title:'Ballanki A1 Furnitures — Furniture made for your home',image:'/images/banners/ballanki-evergreen.svg',href:'/customer/products',active:true};
const defaults=()=>({revision:0,banners:[{...defaultBanner}]});
async function read(){return (await Setting.findOne({key:KEY}))?.value||defaults();}
function validate(banners){
 if(!Array.isArray(banners)||!banners.length||banners.length>12)fail(400,'Provide 1–12 banners, including the permanent banner');
 const ids=new Set();const rows=banners.map(b=>{
  if(!b||typeof b.id!=='string'||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(b.id)||ids.has(b.id))fail(400,'Banner IDs must be unique');ids.add(b.id);
  if(typeof b.title!=='string'||!b.title.trim()||b.title.trim().length>160)fail(400,'Give every banner a descriptive title (up to 160 characters)');
  if(typeof b.active!=='boolean')fail(400,'Choose banner visibility');
  if(b.id===FIXED&&!b.active)fail(400,'The permanent banner must always be visible');
  if(b.image!==defaultBanner.image){try{const u=new URL(b.image);if(u.protocol!=='https:'||u.hostname!=='res.cloudinary.com'||u.username||u.password||u.port||u.href.length>2000)throw 0;}catch{fail(400,'Upload a banner image to Cloudinary');}}
  const href=b.href||'';if(typeof href!=='string'||href.length>1000||(href&&!/^\/(?!\/)[^\\\s]*$/.test(href)))fail(400,'Banner destination must be an internal website path, for example /customer/products');
  return {id:b.id,title:b.title.trim(),image:b.image,href,active:b.active};
 });
 if(!ids.has(FIXED))fail(400,'The permanent banner cannot be removed');return rows;
}
async function save(revision,banners){
 if(!Number.isInteger(revision)||revision<0)fail(400,'Invalid banner revision');
 const rows=validate(banners),current=await read();if(current.revision!==revision)fail(409,'Banners changed in another session. Reload before saving.');
 const value={revision:revision+1,banners:rows};
 if(revision===0){try{await Setting.create({key:KEY,value});}catch(e){if(e.code===11000)fail(409,'Banners changed in another session. Reload before saving.');throw e;}}
 else if(!await Setting.findOneAndUpdate({key:KEY,'value.revision':revision},{$set:{value}},{new:true}))fail(409,'Banners changed in another session. Reload before saving.');
 return value;
}
function publicView(doc){const banners=doc.banners.filter(b=>b.active||b.id===FIXED);if(!banners.some(b=>b.id===FIXED))banners.unshift({...defaultBanner});return {revision:doc.revision,banners};}
module.exports={read,save,validate,publicView,defaults,FIXED};
