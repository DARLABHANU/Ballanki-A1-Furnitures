const assert=require('node:assert/strict');
const {deliveryEstimate,validateDeliveryDays}=require('../src/lib/delivery');
const Product=require('../src/models/Product');
let checks=0;const equal=(a,b)=>{assert.equal(a,b);checks++;};
const fixtures=[
 ['2026-10-19T08:00:00Z',7,'2026-10-26'],
 ['2026-10-19T18:29:59Z',1,'2026-10-20'],
 ['2026-10-19T18:30:00Z',1,'2026-10-21'],
 ['2026-12-31T10:00:00Z',2,'2027-01-02'],
 ['2028-02-28T06:00:00Z',1,'2028-02-29'],
 ['2028-02-29T06:00:00Z',1,'2028-03-01']
];
for(const [from,days,date]of fixtures){const estimate=deliveryEstimate({delivery_duration_days:days},new Date(from));equal(estimate.expected_delivery_date.slice(0,10),date);equal(estimate.delivery_duration_days,days);}
for(const value of [undefined,null,'',false,true,0,-1,1.5,Infinity,NaN,3651,'1.5',' ']){assert.throws(()=>validateDeliveryDays(value),e=>e.status===400);checks++;}
equal(validateDeliveryDays('15'),15);equal(validateDeliveryDays(3650),3650);
equal(deliveryEstimate({expected_delivery_date:'2099-01-01'}).expected_delivery_date,null);
const product=Product.hydrate({_id:'507f1f77bcf86cd799439011',name:'Wooden chair',price:100,delivery_duration_days:15,expected_delivery_date:new Date('2000-01-01')});
equal(product.toJSON().expected_delivery_date,deliveryEstimate(product).expected_delivery_date);
equal(product.toJSON().delivery_duration_days,15);
const ordered=structuredClone(deliveryEstimate(product,new Date('2026-10-19T10:00:00Z')));product.delivery_duration_days=30;
equal(ordered.expected_delivery_date.slice(0,10),'2026-11-03');equal(deliveryEstimate(product,new Date('2026-10-19T10:00:00Z')).expected_delivery_date.slice(0,10),'2026-11-18');
console.log(`${checks} delivery-day validation, India-date, leap-year, legacy-date and snapshot checks passed.`);
