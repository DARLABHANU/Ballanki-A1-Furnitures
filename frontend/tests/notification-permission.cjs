const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
function fixture(permission='default',response='default'){let calls=0;const n={permission,requestPermission:async()=>{calls++;n.permission=response;return response;}};const c={exports:{},Notification:n};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/notificationPermission.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,c);return{n,calls:()=>calls,ask:c.exports.requestNotificationPermission};}
(async()=>{
let f=fixture();await Promise.all([f.ask(true),f.ask(true)]);assert.equal(f.calls(),1);await f.ask(true);assert.equal(f.calls(),1);await f.ask(false);assert.equal(f.calls(),2);
f=fixture('granted');assert.equal(await f.ask(true),'granted');assert.equal(f.calls(),0);
f=fixture('denied');assert.equal(await f.ask(true),'denied');assert.equal(f.calls(),0);
f=fixture('default','granted');assert.equal(await f.ask(true),'granted');await f.ask(true);assert.equal(f.calls(),1);
f=fixture();f.n.requestPermission=async()=>{throw Error('Requires user gesture');};assert.equal(await f.ask(true),'default');
f=fixture();f.n.requestPermission=()=>{throw Error('Not supported here');};assert.equal(await f.ask(true),'default');
console.log('Automatic permission checks passed: single on-open request, Strict Mode/concurrency deduplication, tap fallback, granted/denied reuse and blocked-request handling.');
})().catch(e=>{console.error(e);process.exitCode=1;});
