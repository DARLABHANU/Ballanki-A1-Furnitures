const {fail}=require('./http');
function payablePaise(order){
 const paid=order.paid_amount_paise??Math.round((order.paid_amount||0)*100);
 const total=Math.round(order.total_amount*100),initial=Math.round((order.amount_due_now??order.total_amount)*100);
 if(order.has_preorder&&paid>=initial&&paid<total&&!order.balance_released_at)fail(409,'The store is making your furniture. Balance payment opens only after the owner marks it ready for delivery.');
 return Math.max(0,(paid<initial?initial:total)-paid);
}
module.exports={payablePaise};
