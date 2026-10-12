import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { CardSkeleton } from '@/components/shared/refresh/card-skeleton';
import { SailingRefresh } from '@/components/shared/refresh/sailing-refresh';
import { getApiOrigin } from '@/api/runtime-origin';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/session';
import { createApiClient } from '@/api/client';
import { paperActivityApi, type PaperActivity } from '@/api/paper-activity';
import { formatUsdc } from '@/api/wallet';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import { InterFont } from '@/constants/fonts';

const labels={BUY:'Buy',SELL:'Sell',CREATE:'Vault seed',CONTRIBUTE:'Contribution',CANCEL:'Funding returned',CLAIM:'Payout / refund claimed'};
export default function PaperActivityScreen() {
  const auth=useAuth();
  return <Activity key={auth.accountId??'signed-out'} />;
}
function Activity() {
  const auth=useAuth(),insets=useSafeAreaInsets(),{settings,ready}=useAccountSettings();
  const hidden=!ready||settings.hideBalances;
  const api=useMemo(()=>paperActivityApi(createApiClient({origin:getApiOrigin(),getAccessToken:auth.getAccessToken})),[auth.getAccessToken]);
  const [items,setItems]=useState<PaperActivity[]>([]),[cursor,setCursor]=useState<string|null>(null);
  const [loadKind,setLoadKind]=useState<'refresh'|'page'|null>(null),[error,setError]=useState<string|null>(null);
  const [status,setStatus]=useState<'loading'|'success'|'error'>('loading');
  const request=useRef<AbortController|null>(null),busy=useRef(false),retryCursor=useRef<string|null>(null);
  const load=useCallback(async(after:string|null)=>{
    if(busy.current||!auth.accountId)return;
    retryCursor.current=after;
    const controller=new AbortController();request.current=controller;busy.current=true;setLoadKind(after?'page':'refresh');setError(null);setStatus(previous=>previous==='success'?previous:'loading');
    try {
      const page=await api.list(after,controller.signal);
      if(controller.signal.aborted)return;
      setItems(prior=>after?[...prior,...page.items.filter(row=>!prior.some(old=>old.id===row.id))]:page.items);setCursor(page.nextCursor);setStatus('success');
    } catch(cause) {if(!controller.signal.aborted){setStatus('error');setError(cause instanceof Error?cause.message:'Could not load activity.');}}
    finally {if(request.current===controller){busy.current=false;setLoadKind(null);}}
  },[api,auth.accountId]);
  useFocusEffect(useCallback(()=>{void load(null);return()=>{request.current?.abort();request.current=null;busy.current=false;};},[load]));
  return <View style={[s.root,{paddingTop:insets.top}]}>
    <View style={s.header}><Pressable accessibilityRole="button" onPress={()=>router.canGoBack()?router.back():router.replace('/')}><Text style={s.link}>Back</Text></Pressable><Text style={s.title}>Paper activity</Text></View>
    <SailingRefresh refreshing={loadKind==='refresh'} onRefresh={()=>load(null)} enabled={!!auth.accountId}>{scrollProps => <FlatList {...scrollProps} data={items} keyExtractor={row=>row.id} contentContainerStyle={[s.content,{paddingBottom:insets.bottom+32}]}
      onEndReached={()=>{if(cursor&&!error)void load(cursor);}} onEndReachedThreshold={0.2}
      ListHeaderComponent={<Text style={s.copy}>Your trades, vault funding and payouts</Text>}
      ListEmptyComponent={!auth.accountId?<Text style={s.copy}>Sign in to see your activity.</Text>:status==='loading'?<CardSkeleton label="Loading activity…" count={2} compact/>:status==='success'&&!error?<Text style={s.copy}>No paper activity yet.</Text>:null}
      renderItem={({item})=><View style={s.card}>
        <Text style={s.label}>{labels[item.kind]}{item.symbol?` · ${item.symbol}`:''}</Text>
        <Text style={s.copy}>{item.vault_name}</Text>
        <Text style={s.label}>{hidden?'••••':`${formatUsdc(item.amount_usdc)} USDC`}{item.kind==='BUY'||item.kind==='SELL'?' requested':''}</Text>
        {item.quantity?<Text style={s.copy}>{hidden?'••••':`${Number(item.quantity).toLocaleString(undefined,{maximumFractionDigits:6})} ${item.symbol??''}`} filled · Fee {hidden?'••••':`${formatUsdc(item.fee_usdc??'0')} USDC`}</Text>:null}
        <Text style={s.copy}>{item.status.replaceAll('_',' ')} · {new Date(item.at).toLocaleString()}</Text>
        {item.reason?<Text style={s.error}>{item.reason.replaceAll('_',' ')}</Text>:null}
      </View>}
      ListFooterComponent={<>{loadKind==='page'?<ShipLoader compact label="Loading more activity…"/>:null}{error?<View><Text accessibilityRole="alert" style={s.error}>{error}</Text><Pressable accessibilityRole="button" onPress={()=>{void load(retryCursor.current);}}><Text style={s.link}>Retry activity</Text></Pressable></View>:null}</>}/>}</SailingRefresh>
  </View>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:C.surface},header:{padding:20,flexDirection:'row',alignItems:'center',gap:20},title:{fontFamily:InterFont.semiBold,fontSize:23,color:C.ink},content:{padding:20,gap:12},card:{padding:18,gap:7,borderRadius:20,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:C.border},label:{fontFamily:InterFont.semiBold,fontSize:15,color:C.ink},copy:{fontFamily:InterFont.regular,fontSize:13,color:C.secondary},link:{fontFamily:InterFont.semiBold,fontSize:15,color:C.ink,paddingVertical:12},error:{fontFamily:InterFont.regular,fontSize:13,color:C.negative}});
