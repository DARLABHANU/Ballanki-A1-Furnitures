const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const listeners={},shown=[],opened=[],navigated=[],messages=[];let owner='alice',windows=[];
const self={location:{origin:'https://www.ballankia1furnitures.in'},addEventListener:(type,fn)=>{listeners[type]=fn;},registration:{showNotification:async(title,options)=>shown.push({title,...options}),getNotifications:async()=>[]},clients:{claim:async()=>{},matchAll:async()=>windows,openWindow:async url=>opened.push(url)},skipWaiting:async()=>{}};
const context={self,URL,indexedDB:{}};vm.createContext(context);vm.runInContext(fs.readFileSync('public/push-sw.js','utf8'),context);context.owner=async(value,write)=>write?(owner=value):owner;
async function event(type,data){let work;listeners[type]({...data,waitUntil:promise=>{work=promise;}});await work;}
let checks=0;const check=(value,label)=>{assert.ok(value,label);checks++;};
(async()=>{
 check(!listeners.fetch,'service worker does not cache pages or API data');
 await event('push',{data:{json:()=>({id:'one',user_id:'bob',title:'Private update'})}});check(shown.length===0,'other account payload not displayed');
 windows=[{url:self.location.origin+'/',postMessage:msg=>messages.push(msg),navigate:async url=>navigated.push(url),focus:async()=>{}}];
 await event('push',{data:{json:()=>({id:'one',user_id:'alice',title:'Order update',body:'Open account',url:'/customer/orders/one'})}});check(shown.length===1&&shown[0].tag==='ballanki-one','own notification displayed and deduplicated');check(messages[0].user_id==='alice','in-app refresh event stays with owner');
 let closed=0;await event('notificationclick',{notification:{data:shown[0].data,close:()=>closed++}});check(navigated[0]===self.location.origin+'/customer/orders/one'&&closed===1,'click focuses correct order');
 windows=[];await event('notificationclick',{notification:{data:{user_id:'alice',url:'https://evil.test/steal'},close:()=>{}}});check(opened[0]===self.location.origin+'/','cross-origin notification links blocked');
 owner='bob';await event('notificationclick',{notification:{data:shown[0].data,close:()=>{}}});check(opened.length===1,'stale notification click blocked after account change');
 for(const value of ['//evil.test','/\\evil.test','javascript:alert(1)'])check(context.safeURL(value)===self.location.origin+'/','unsafe URL sanitized');
 console.log(`${checks} service-worker display, owner isolation, notification click and URL safety checks passed.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
