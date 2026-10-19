export function expectedDeliveryDate(days:number|null|undefined,from=new Date()):string|null {
 if(!Number.isInteger(days)||!days||days<1||days>3650)return null;
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(from);
 const part=(kind:string)=>Number(parts.find(p=>p.type===kind)!.value);
 return new Date(Date.UTC(part('year'),part('month')-1,part('day')+days)).toISOString();
}
