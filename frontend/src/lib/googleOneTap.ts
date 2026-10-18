export type GoogleIdentity = {
 initialize: (options:{client_id:string;callback:(result:{credential:string})=>void;auto_select:boolean;cancel_on_tap_outside:boolean})=>void;
 renderButton:(element:HTMLElement,options:{theme:string;size:string;text:string;width:number})=>void;
 prompt:()=>void;
 cancel:()=>void;
};
export function googleIdentity():GoogleIdentity|undefined{
 return (window as Window & {google?:{accounts:{id:GoogleIdentity}}}).google?.accounts.id;
}
export function canOfferOneTap(path:string,authenticated:boolean,loading:boolean,locationBusy:boolean):boolean{
 return !authenticated&&!loading&&!locationBusy&&!/^\/(auth|admin|support|promoter)(\/|$)/.test(path)&&!/^\/customer\/orders(\/|$)/.test(path);
}
export function offerOneTap(identity:GoogleIdentity,storage:Pick<Storage,'getItem'|'setItem'>):boolean{
 const key='ballanki-google-one-tap-offered';
 try{if(storage.getItem(key)==='1')return false;storage.setItem(key,'1');}catch{}
 identity.prompt();return true;
}
