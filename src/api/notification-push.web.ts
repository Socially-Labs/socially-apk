import type { createApiClient } from './client';
export async function registerNotificationPush(_client:ReturnType<typeof createApiClient>,requestPermission=false){
 if(requestPermission)throw new Error('Push notifications are available in the installed Android and iOS app.');
 return false;
}
export async function revokeNotificationPush(){}
export function observeNotificationPush(_client:ReturnType<typeof createApiClient>,_onWake:()=>void,_onOpen:(id:string)=>void){return()=>{};}
