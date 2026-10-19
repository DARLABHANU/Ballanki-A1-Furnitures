const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const out={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/deliveryEstimate.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:out,Intl,Date});
const backend=require('../../backend/src/lib/delivery');let checks=0;
for(const date of ['2026-10-19T18:29:59Z','2026-10-19T18:30:00Z','2026-12-31T23:00:00Z','2028-02-28T12:00:00Z'])for(const days of [1,7,15,30,3650,null,undefined,0,-1,1.2]){assert.equal(out.expectedDeliveryDate(days,new Date(date)),backend.deliveryEstimate({delivery_duration_days:days},new Date(date)).expected_delivery_date);checks++;}
console.log(`${checks} frontend/backend delivery-date parity checks passed.`);
