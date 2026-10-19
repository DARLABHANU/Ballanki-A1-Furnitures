const PDFDocument=require('pdfkit');
const money=value=>'INR '+Number(value||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
// Generate from immutable order snapshots and server payment accounting, never request totals.
module.exports=async function invoice(order){
 const connected=require('mongoose').connection.readyState===1;const attempts=connected?await require('../models/PaymentAttempt').find({order:order._id,provider:'razorpay',state:'COMPLETED',reconciled:true}).sort({createdAt:1}):[];const returned=connected?await require('../models/Commerce').ReturnRequest.findOne({order_id:order._id}):null;
 const seller=order.invoice_seller||{name:'Ballanki A1 Furnitures'};
 const doc=new PDFDocument({size:'A4',margin:48,bufferPages:true,info:{Title:'Order invoice '+order.order_number,Author:seller.name}});
 const chunks=[];const ready=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const line=(text,size=10,color='#334155')=>{doc.font('Helvetica').fontSize(size).fillColor(color).text(String(text));doc.moveDown(.45);};
 const room=height=>{if(doc.y+height>doc.page.height-65)doc.addPage();};
 line(seller.name.toUpperCase(),21,'#173f35');[seller.address,seller.email,seller.phone].filter(Boolean).forEach(value=>line(value,9));line((order.paid_amount||0)>0?'SALES INVOICE / PAYMENT SUMMARY':'ORDER SUMMARY - PAYMENT NOT RECEIVED',11);line('Invoice: '+(order.invoice_number||'INV-'+order.order_number));line('Order: '+order.order_number);line('Ordered: '+new Date(order.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}));
 if(order.payment_environment==='sandbox')line('TEST ORDER - NO REAL FUNDS COLLECTED',12,'#92400e');
 line('Order status: '+order.status+' | Payment: '+order.payment_status);doc.moveDown();
 line('DELIVERY TO',11,'#173f35');const a=order.shipping_address||{};
 [a.full_name,a.line1,a.line2,[a.city,a.state,a.pincode].filter(Boolean).join(', '),a.country,a.phone].filter(Boolean).forEach(v=>line(v));doc.moveDown();
 line('ITEMS',11,'#173f35');
 for(const item of order.items){room(110);line(item.product_name,12,'#172b26');line('Quantity '+item.quantity+' x '+money(item.unit_price)+' = '+money(item.total_price));
 if(item.delivery_duration_days)line('Making + delivery: '+item.delivery_duration_days+' calendar days from order date');
 if(item.preorder_quantity)line('Pre-booked units: '+item.preorder_quantity+' | Ready stock: '+(item.ready_stock_quantity||0));
 line(item.expected_delivery_date?'Expected delivery: '+new Date(item.expected_delivery_date).toLocaleDateString('en-IN',{timeZone:'UTC'}):'Delivery date: awaiting store confirmation');doc.moveDown(.4);}
 room(270);doc.moveDown();
 [['Subtotal',order.subtotal],['Discount',-Number(order.discount_amount||0)],['Delivery',order.shipping_amount],...(order.tax_amount?[['Tax',order.tax_amount]]:[]),['Order total',order.total_amount],['Pre-booking advance (20%)',order.advance_amount||0],['Initial payment required',order.amount_due_now??order.total_amount],['Verified payments received',order.paid_amount||0],['Refunded',order.refunded_amount||0],['Outstanding',order.outstanding_amount??Math.max(0,order.total_amount-(order.paid_amount||0))]].forEach(([label,value])=>line(label+': '+money(value),label==='Order total'?14:11));
 if(order.has_preorder)line(order.balance_released_at?'Furniture ready: balance payment unlocked before dispatch.':'Balance payment is locked until the owner confirms furniture is ready for delivery.',10);
 line('Seller is not GST-registered. No GST has been charged. This is not a GST tax invoice.',9);
 if(attempts.length){room(80);line('VERIFIED PAYMENT RECEIPTS',11,'#173f35');for(const payment of attempts){room(65);line(payment.provider_payment_id+' | '+money(payment.amount_paise/100));line('Received: '+new Date(payment.captured_at||payment.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' | '+payment.environment,9);}}
 if(returned?.refunds?.length){room(70);line('REFUNDS',11,'#173f35');for(const refund of returned.refunds){room(50);line(refund.id+' | '+money(refund.amount)+' | '+refund.status,9);}}
 room(60);if(seller.footer)line(seller.footer,9);
 line('Pending orders are not proof of payment. Only verified captured payments appear as paid.',9);
 const pages=doc.bufferedPageRange();for(let n=pages.start;n<pages.start+pages.count;n++){doc.switchToPage(n);doc.fontSize(8).fillColor('#64748b').text(seller.name+' | '+order.order_number+' | Page '+(n+1),48,doc.page.height-45,{lineBreak:false});}
 doc.end();return ready;
};
