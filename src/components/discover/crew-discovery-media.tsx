import { demoDiscoveryMedia } from './demo-discovery-media';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Shield } from 'lucide-react-native';
import { ProfileMediaImage } from '@/components/settings/profile-media-image';
import { profileFallback } from '@/components/settings/profile-fallbacks';
import { DiscoverPalette as D } from '@/constants/theme';

export function DiscoveryBanner({uri,identity,height=84}:{uri:string|null|undefined;identity:string;height?:number}){
 const demo=demoDiscoveryMedia(identity);
 return <View style={{height,overflow:'hidden',backgroundColor:D.accentTint}}><ProfileMediaImage kind="banner" uri={uri} fallbackId={profileFallback(identity).id} bundled={demo?.banner}/></View>;
}
export function DiscoveryAvatar({uri,identity,vault=false,size=52}:{uri?:string|null;identity:string;vault?:boolean;size?:number}){
 const demo=demoDiscoveryMedia(identity);
 const [failed,setFailed]=useState<string|null>(null);
 return <View style={{width:size,height:size,borderRadius:size/2,borderWidth:3,borderColor:D.surface,overflow:'hidden',backgroundColor:D.ink,alignItems:'center',justifyContent:'center'}}>
  {demo?<ProfileMediaImage uri={uri} kind="avatar" fallbackId={profileFallback(identity).id} bundled={vault?demo.banner:demo.avatar}/>:vault?uri&&uri!==failed?<Image source={{uri}} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} onError={()=>setFailed(uri)}/>:<Shield color={D.heroInk} size={size*0.44} strokeWidth={1.5}/>:<ProfileMediaImage uri={uri} kind="avatar" fallbackId={profileFallback(identity).id}/>}
 </View>;
}
