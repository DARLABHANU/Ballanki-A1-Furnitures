const PDFDocument=require('pdfkit');
const money=value=>'INR '+Number(value||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
// Generate from immutable order snapshots and server payment accounting, never request totals.
module.exports=async function invoice(order){
 const doc=new PDFDocument({size:'A4',margin:48,bufferPages:true,info:{Title:'Order invoice '+order.order_number,Author:'Ballanki A1 Furnitures'}});
 const chunks=[];const ready=new Promise((resolve,reject)=>{doc.on('data',c=>chunks.push(c));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
 const line=(text,size=10,color='#334155')=>{doc.font('Helvetica').fontSize(size).fillColor(color).text(String(text));doc.moveDown(.45);};
 const room=height=>{if(doc.y+height>doc.page.height-65)doc.addPage();};
 line('BALLANKI A1 FURNITURES',21,'#173f35');line('ORDER INVOICE',11);line('Invoice: INV-'+order.order_number);line('Order: '+order.order_number);line('Ordered: '+new Date(order.createdAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}));
 if(order.payment_environment==='sandbox')line('TEST ORDER - NO REAL FUNDS COLLECTED',12,'#92400e');
 line('Order status: '+order.status+' | Payment: '+order.payment_status);doc.moveDown();
 line('DELIVERY TO',11,'#173f35');const a=order.shipping_address||{};
 [a.full_name,a.line1,a.line2,[a.city,a.state,a.pincode].filter(Boolean).join(', '),a.country,a.phone].filter(Boolean).forEach(v=>line(v));doc.moveDown();
 line('ITEMS',11,'#173f35');
 for(const item of order.items){room(110);line(item.product_name,12,'#172b26');line('Quantity '+item.quantity+' x '+money(item.unit_price)+' = '+money(item.total_price));
 if(item.preorder_quantity)line('Pre-booked units: '+item.preorder_quantity+' | Ready stock: '+(item.ready_stock_quantity||0));
 line(item.expected_delivery_date?'Expected delivery: '+new Date(item.expected_delivery_date).toLocaleDateString('en-IN',{timeZone:'UTC'}):'Delivery date: awaiting store confirmation');doc.moveDown(.4);}
 room(235);doc.moveDown();
 [['Subtotal',order.subtotal],['Discount',-Number(order.discount_amount||0)],['Delivery',order.shipping_amount],...(order.tax_amount?[['Tax',order.tax_amount]]:[]),['Order total',order.total_amount],['Verified paid',order.paid_amount||0],['Outstanding',order.outstanding_amount??Math.max(0,order.total_amount-(order.paid_amount||0))]].forEach(([label,value])=>line(label+': '+money(value),label==='Order total'?14:11));
 line('This document is an order and payment summary, not a GST tax invoice.',9);
 line('Pending orders are not proof of payment. Only verified captured payments appear as paid.',9);
 const pages=doc.bufferedPageRange();for(let n=pages.start;n<pages.start+pages.count;n++){doc.switchToPage(n);doc.fontSize(8).fillColor('#64748b').text('Ballanki A1 Furnitures | '+order.order_number+' | Page '+(n+1),48,doc.page.height-45,{lineBreak:false});}
 doc.end();return ready;
};
