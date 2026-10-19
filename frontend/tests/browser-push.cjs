const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),assert=require('node:assert/strict');
const key=Buffer.concat([Buffer.from([4]),Buffer.alloc(64,1)]).toString('base64url');let permission='granted',prompts=0,posts=0,subscribed=0,unsubscribed=0,owner=null,subscription=null;
const storage=new Map();
const reg={active:{postMessage:(message,ports)=>{owner=message.user;ports[0].reply({ok:true});}},pushManager:{getSubscription:async()=>subscription,subscribe:async()=>{subscribed++;subscription={options:{applicationServerKey:Uint8Array.from(Buffer.from(key,'base64url')).buffer},endpoint:'https://fcm.googleapis.com/test',toJSON:()=>({endpoint:'https://fcm.googleapis.com/test'}),unsubscribe:async()=>{unsubscribed++;subscription=null;return true;}};return subscription;}}};
class Channel{constructor(){this.port1={onmessage:null,close(){}};this.port2={reply:value=>queueMicrotask(()=>this.port1.onmessage?.({data:value}))};}}
const context={exports:{},require:name=>{assert.equal(name,'@/lib/api');return{api:{post:async()=>{posts++;},delete:async()=>{posts++;}}};},window:{isSecureContext:true,PushManager:{}},navigator:{serviceWorker:{register:async()=>reg,ready:Promise.resolve(reg),getRegistration:async()=>reg}},Notification:{get permission(){return permission;},requestPermission:async()=>{prompts++;return permission;}},localStorage:{setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},MessageChannel:Channel,Uint8Array,ArrayBuffer,atob:s=>Buffer.from(s,'base64').toString('binary'),setTimeout,clearTimeout};context.window.Notification=context.Notification;
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/browserPush.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context);
const push=context.exports;let checks=0;const check=(value,label)=>{assert.ok(value,label);checks++;};
(async()=>{
 check(prompts===0&&posts===0,'no prompt or subscription on import');check(push.pushSupported(),'feature detection');
 permission='denied';await assert.rejects(push.enableBrowserPush({enabled:true,public_key:key},'alice'));check(posts===0&&subscribed===0,'denied permission stops setup');
 permission='granted';await push.enableBrowserPush({enabled:true,public_key:key},'alice');check(prompts===1,'existing granted permission is reused without another prompt');check(owner==='alice'&&subscribed===1&&posts===1,'subscribe and bind current user');check(storage.get('push-enabled:alice')==='true','opt-in saved only after server success');
 check(await push.syncBrowserPush('alice',()=>true,key),'existing subscription sync');check(prompts===1,'sync does not request permission');
 await assert.rejects(push.syncBrowserPush('bob',()=>false,key));check(owner==='alice','cancelled account switch cannot bind another user');
 check(!await push.syncBrowserPush('alice',()=>true,Buffer.alloc(65,2).toString('base64url'))&&owner===null,'key rotation requires re-enable');
 await push.clearBrowserPush('alice');check(unsubscribed===1&&subscription===null&&!storage.has('push-enabled:alice'),'disable clears device binding and opt-in');
 console.log(`${checks} browser push opt-in, permission, account binding, key rotation and disable checks passed; browser API mocked.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
