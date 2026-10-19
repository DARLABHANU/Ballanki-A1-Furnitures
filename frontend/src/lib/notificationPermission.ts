let automaticAttempted=false;
let pending:Promise<NotificationPermission>|null=null;
// One automatic attempt per page load, including React Strict Mode remounts.
export function requestNotificationPermission(automatic=false):Promise<NotificationPermission>{
 if(Notification.permission!=="default")return Promise.resolve(Notification.permission);
 if(pending)return pending;
 if(automatic&&automaticAttempted)return Promise.resolve(Notification.permission);
 if(automatic)automaticAttempted=true;
 try{pending=Notification.requestPermission().catch(()=>Notification.permission).finally(()=>{pending=null;});return pending;}
 catch{return Promise.resolve(Notification.permission);}
}
