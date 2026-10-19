const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const axios = require('axios');
const compiled = ts.transpileModule(fs.readFileSync('src/lib/catalogRetry.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const exportsObject = {};
vm.runInNewContext(compiled,{exports:exportsObject,setTimeout:fn=>{fn();}});
async function scenario({url='/products',method='get',status=503,code,failures=1,abort=false,network=false}) {
 let calls=0;const controller=new AbortController();
 const client=axios.create({adapter:async config=>{
  calls++;
  if(calls<=failures){if(abort)controller.abort();throw new axios.AxiosError('temporary',code,config,null,network?undefined:{status,data:{},headers:{},config});}
  return {data:{items:[{id:'real-response'}]},status:200,statusText:'OK',headers:{},config};
 }});
 exportsObject.installCatalogRetry(client);
 let response,error;try{response=await client.request({url,method,signal:controller.signal});}catch(e){error=e;}
 return {calls,response,error};
}
(async()=>{
 let r=await scenario({});assert.equal(r.calls,2);assert.equal(r.response.data.items[0].id,'real-response');
 r=await scenario({failures:2});assert.equal(r.calls,3);assert.ok(r.response);
 r=await scenario({failures:10});assert.equal(r.calls,3);assert.ok(r.error);
 for(const status of [400,401,403,404,409,500]){r=await scenario({status});assert.equal(r.calls,1);assert.ok(r.error);}
 for(const url of ['/auth/login','/payments/razorpay/start','/orders']){r=await scenario({url});assert.equal(r.calls,1);}
 r=await scenario({method:'post'});assert.equal(r.calls,1);
 r=await scenario({abort:true});assert.equal(r.calls,1);
 r=await scenario({url:'/products/123'});assert.equal(r.calls,2);
 r=await scenario({url:'/catalog'});assert.equal(r.calls,2);
 r=await scenario({url:'/admin/catalog'});assert.equal(r.calls,1);
 for(const code of ['ECONNABORTED','ERR_NETWORK','ETIMEDOUT']){r=await scenario({code,network:true});assert.equal(r.calls,2);assert.ok(r.response);}
 console.log('Catalog retry: recovery, bounded failures, non-retry errors, writes, payments and cancellation checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});

