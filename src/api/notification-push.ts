import type { Notification } from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { orderStorage } from './market-order-storage';
import type { createApiClient } from './client';

type Client=ReturnType<typeof createApiClient>;
let revoke: (()=>Promise<void>) | undefined;
// Importing expo-notifications itself fails in Android Expo Go, before any API guard.
const Notifications: typeof import('expo-notifications') | null =
 Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
 (Platform.OS !== 'android' && Platform.OS !== 'ios')
  ? null
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Must avoid evaluating this native module in Expo Go.
  : require('expo-notifications');
// Foreground presentation belongs to our pearl toast; prevent a second OS banner.
Notifications?.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:false,shouldSetBadge:false,shouldShowBanner:false,shouldShowList:false})});
async function installation(){
 let id=await orderStorage.read('notification-installation');
 if(!id){id=Crypto.randomUUID();await orderStorage.write('notification-installation',id);}
 return id;
}
export async function registerNotificationPush(client:Client,requestPermission=false){
 if(!Notifications){if(requestPermission)throw new Error('Push notifications need an installed development or production app. They are unavailable in Expo Go.');return false;}
 const projectId=Constants.expoConfig?.extra?.eas?.projectId??Constants.easConfig?.projectId;
 if(!projectId){if(requestPermission)throw new Error('Push notifications need an EAS project and a new app build.');return false;}
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('account-updates',{name:'Account updates',importance:Notifications.AndroidImportance.DEFAULT,lockscreenVisibility:Notifications.AndroidNotificationVisibility.PRIVATE});
 let permission=await Notifications.getPermissionsAsync();
 if(!permission.granted && requestPermission)permission=await Notifications.requestPermissionsAsync();
 if(!permission.granted){const prior=await orderStorage.read('notification-installation');if(prior)await client.request('/v0/me/notification-device',{method:'DELETE',body:{installationId:prior}}).catch(()=>undefined);if(requestPermission)throw new Error('Notifications are disabled. You can allow them in your phone settings.');return false;}
 const id=await installation();
 const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
 await client.request('/v0/me/notification-device',{method:'PUT',body:{installationId:id,token,platform:Platform.OS}});
 revoke=async()=>{await client.request('/v0/me/notification-device',{method:'DELETE',body:{installationId:id}});};
 return true;
}
export async function revokeNotificationPush(){
 try{await revoke?.();}finally{revoke=undefined;await Notifications?.dismissAllNotificationsAsync();}
}
export function observeNotificationPush(client:Client,onWake:()=>void,onOpen:(id:string)=>void){
 if(!Notifications)return()=>{};
 let stopped=false;
 const process=async(notification:Notification,open:boolean)=>{
  const data=notification.request.content.data;
  if(!data || typeof data.notificationId!=='string' || !/^[1-9]\d*$/.test(data.notificationId) || typeof data.accountId!=='string')return;
  try{
   const account=await client.me();
   if(stopped || account.id!==data.accountId)return;
   onWake();if(open)onOpen(data.notificationId);
  }catch{/* Resume/reconnect REST recovery remains available. */}
 };
 const received=Notifications.addNotificationReceivedListener(n=>{void process(n,false);});
 const response=Notifications.addNotificationResponseReceivedListener(r=>{void process(r.notification,true);void Notifications.clearLastNotificationResponseAsync();});
 const rotated=Notifications.addPushTokenListener(()=>{void registerNotificationPush(client).catch(()=>undefined);});
 const last=Notifications.getLastNotificationResponse();
 if(last){void process(last.notification,true);void Notifications.clearLastNotificationResponseAsync();}
 return()=>{stopped=true;received.remove();response.remove();rotated.remove();};
}
