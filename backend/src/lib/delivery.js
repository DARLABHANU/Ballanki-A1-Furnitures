const {fail}=require('./http');
function validateDeliveryDays(value){
 if(!['number','string'].includes(typeof value)||String(value).trim()===''||!Number.isInteger(Number(value))||Number(value)<1||Number(value)>3650)fail(400,'Total making and delivery time must be a whole number from 1 to 3650 days');
 return Number(value);
}
// Calendar days, anchored to the order/visit date in India rather than the host timezone.
function deliveryEstimate(product,from=new Date()){
 const days=product.delivery_duration_days;
 if(!Number.isInteger(days)||days<1||days>3650)return {delivery_duration_days:null,expected_delivery_date:null};
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(from);
 const part=kind=>Number(parts.find(p=>p.type===kind).value);
 const date=new Date(Date.UTC(part('year'),part('month')-1,part('day')+days));
 return {delivery_duration_days:days,expected_delivery_date:date.toISOString()};
}
module.exports={validateDeliveryDays,deliveryEstimate};
