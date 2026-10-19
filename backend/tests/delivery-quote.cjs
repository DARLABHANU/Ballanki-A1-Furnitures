const assert=require('node:assert/strict'),mongoose=require('mongoose');
const Product=require('../src/models/Product'),{CartItem,Offer}=require('../src/models/Commerce');
const {deliveryEstimate}=require('../src/lib/delivery');
const products=[3,20].map((days,index)=>new Product({_id:new mongoose.Types.ObjectId(),name:'Delivery test '+index,price:1000,stock_quantity:0,is_active:true,is_approved:true,delivery_duration_days:days}));
CartItem.find=()=>({populate:async()=>products.map(product=>({_id:new mongoose.Types.ObjectId(),product,quantity:1}))});
Offer.findOne=()=>({sort:async()=>null});
const router=require('../src/routes/commerceRoutes');const handler=router.stack.find(layer=>layer.route?.path==='/orders/quote').route.stack[0].handle;
const quote=()=>new Promise((resolve,reject)=>handler({user:{_id:new mongoose.Types.ObjectId()},body:{}},{json:resolve},reject));
(async()=>{
 let result=await quote();assert.equal(result.items.length,2);
 for(let index=0;index<2;index++){assert.equal(result.items[index].delivery_duration_days,products[index].delivery_duration_days);assert.equal(result.items[index].expected_delivery_date,deliveryEstimate(products[index]).expected_delivery_date);}
 assert.notEqual(result.items[0].expected_delivery_date,result.items[1].expected_delivery_date);
 products[1].delivery_duration_days=30;result=await quote();assert.equal(result.items[1].delivery_duration_days,30);assert.equal(result.items[1].expected_delivery_date,deliveryEstimate(products[1]).expected_delivery_date);
 console.log('Mixed-product checkout quote preserves individual day counts/dates and refreshes after a product duration changes; no database writes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
