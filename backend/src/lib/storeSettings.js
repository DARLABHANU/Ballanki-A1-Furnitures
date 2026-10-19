const {Setting}=require('../models/Commerce');const {fail}=require('./http');
const defaults={siteName:'Ballanki A1 Furnitures',footerText:'',seoTitle:'Ballanki A1 Furnitures | Solid Wood Furniture',seoMeta:'Explore wooden furniture, chat with the store and order furniture made for your home.',siteUrl:'https://www.ballankia1furnitures.in',logoUrl:'/logo.png',socialImage:'',businessName:'Ballanki A1 Furnitures',businessAddress:'',supportEmail:'',supportPhone:'',invoiceFooter:'Thank you for shopping with us.'};
function text(value,max=300){if(typeof value!=='string'||value.length>max)fail(400,'Invalid text setting');return value.trim();}
function safeUrl(value,{relative=false,blank=false}={}){if(blank&&!value)return '';if(relative&&/^\/(?!\/)[^\\]*$/.test(value))return value;try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)throw 0;return u.href.replace(/\/$/,'');}catch{fail(400,'Use a valid HTTPS URL');}}
function validateBranding(body){const value={};for(const key of Object.keys(defaults)){if(body[key]===undefined)continue;value[key]=text(body[key],['seoMeta','invoiceFooter','businessAddress','footerText'].includes(key)?2000:300);}
 for(const key of ['siteName','businessName','seoTitle'])if(key in value&&!value[key])fail(400,'Store, business and SEO titles cannot be empty');
 if(value.siteUrl!==undefined)value.siteUrl=safeUrl(value.siteUrl);
 for(const key of ['logoUrl','socialImage'])if(value[key]!==undefined)value[key]=safeUrl(value[key],{relative:true,blank:key==='socialImage'});
 if(value.supportEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.supportEmail))fail(400,'Enter a valid support email');return value;
}
async function branding(){return {...defaults,...((await Setting.findOne({key:'website-settings'}))?.value||{})};}
async function saveBranding(body){const value=validateBranding(body);await Setting.findOneAndUpdate({key:'website-settings'},{$set:Object.fromEntries(Object.entries(value).map(([k,v])=>['value.'+k,v]))},{upsert:true});return branding();}
function invoiceSeller(b){return {name:b.businessName||b.siteName,address:b.businessAddress,email:b.supportEmail,phone:b.supportPhone,footer:b.invoiceFooter,gst_registered:false};}
module.exports={defaults,branding,saveBranding,validateBranding,safeUrl,invoiceSeller};
