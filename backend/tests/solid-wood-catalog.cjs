const assert=require('node:assert/strict');
const Product=require('../src/models/Product');
require('../src/models/Commerce').Setting.findOne=async()=>null;
let captured;
Product.find=filter=>{captured=filter;return {sort(){return this},skip(){return this},limit:async()=>[]}};
Product.countDocuments=async()=>0;
const router=require('../src/routes/productRoutes');
const handler=router.stack.find(layer=>layer.route?.path==='/'&&layer.route.methods.get).route.stack[0].handle;
function run(query){return new Promise((resolve,reject)=>{handler({query},{json:resolve},reject)});}
(async()=>{
 await run({category:'chair',subcategory:'Rocking chairs',construction:'solid_wood'});
 assert.equal(captured['attributes.construction'],'solid_wood');assert.equal(captured.is_active,true);assert.equal(captured.is_approved,true);assert.equal(captured.subcategory.$regex,'Rocking chairs');assert.ok(captured.$and);
 await run({category:'chair'});assert.equal(captured['attributes.construction'],undefined);
 console.log('Solid-wood query, publication scope, subtype and existing unfiltered browsing checks passed; no database writes.');
})().catch(e=>{console.error(e);process.exitCode=1});
