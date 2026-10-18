const router=require('express').Router();
const {asyncRoute:wrap,fail}=require('../lib/http');
// Shared instance throttle and short-lived approximate-location cache for the public OSM service.
const cache=new Map();let nextRequest=0;
router.post('/location/reverse',wrap(async(req,res)=>{
 const {latitude,longitude}=req.body||{};
 if(typeof latitude!=='number'||typeof longitude!=='number'||!Number.isFinite(latitude)||!Number.isFinite(longitude)||latitude < -90||latitude>90||longitude < -180||longitude>180)fail(400,'Invalid location coordinates');
 const lat=latitude.toFixed(3),lon=longitude.toFixed(3),key=lat+','+lon,now=Date.now(),cached=cache.get(key);
 if(cached&&cached.expires>now)return res.json(cached.value);
 if(now<nextRequest){res.set('Retry-After','1');fail(429,'Location lookup is busy. Please retry or enter your PIN code.');}
 nextRequest=now+1100;
 const url=new URL(process.env.GEOCODING_URL||'https://nominatim.openstreetmap.org/reverse');url.search=new URLSearchParams({format:'jsonv2',lat,lon,zoom:'18',addressdetails:'1','accept-language':'en'}).toString();
 let response;try{response=await fetch(url,{headers:{'User-Agent':'BallankiA1Furnitures/1.0 (https://www.ballankia1furnitures.in)','Accept':'application/json'},signal:AbortSignal.timeout(8000)});}catch{fail(503,'Location lookup is unavailable. Please enter your PIN code.');}
 if(!response.ok)fail(503,'Location lookup is unavailable. Please enter your PIN code.');
 let data;try{data=await response.json();}catch{fail(503,'Location lookup returned an invalid response. Please enter your PIN code.');}
 const a=data.address||{};if(a.country_code!=='in')fail(422,'Please enter an Indian delivery PIN code.');
 const pincode=String(a.postcode||'').trim();if(!/^[1-9]\d{5}$/.test(pincode))fail(422,'We could not find a nearby PIN code. Please enter it manually.');
 const city=a.city||a.town||a.village||a.suburb||a.county||a.state_district||'';const state=a.state||'';if(!city||!state)fail(422,'The delivery area could not be identified. Please enter your PIN code.');
 const value={pincode,city,district:a.state_district||a.county||a.city||city,state,source:'device',approximate:true,attribution:'© OpenStreetMap contributors'};
 if(cache.size>=200)cache.delete(cache.keys().next().value);cache.set(key,{value,expires:now+600000});res.json(value);
}));
module.exports=router;
