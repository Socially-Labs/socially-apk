import { useHomeRefreshSource } from '@/components/home/home-refresh-provider';
import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { CardSkeleton } from '@/components/shared/refresh/card-skeleton';
import { SailingRefresh } from '@/components/shared/refresh/sailing-refresh';
import { useState,type ReactNode } from 'react';
import { Image,FlatList,KeyboardAvoidingView,Platform,Pressable,StyleSheet,Text,View } from 'react-native';
import { router,useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVaults } from '@/hooks/use-vaults';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { BrandFont,InterFont } from '@/constants/fonts';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import type { VaultSummary } from '@/api/vaults';

function Action({ children,onPress,disabled=false,secondary=false }: { children:ReactNode; onPress:()=>void; disabled?:boolean; secondary?:boolean }) {
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
  style={({ pressed })=>[s.button,secondary&&s.secondary,(disabled||pressed)&&s.dim]}><Text style={[s.buttonText,secondary&&s.secondaryText]}>{children}</Text></Pressable>;
}
function Frame({ title,children }: { title:string; children:ReactNode }) {
 const insets=useSafeAreaInsets();
 return <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={[s.root,{ paddingTop:insets.top,paddingBottom:insets.bottom }]}>
  <View style={s.header}><Action secondary onPress={()=>router.canGoBack()?router.back():router.replace('/')}>Back</Action><Text accessibilityRole="header" style={s.heading}>{title}</Text></View>{children}
 </KeyboardAvoidingView>;
}
function ErrorText({ value }: { value:string|null }) { return value?<Text accessibilityRole="alert" style={s.error}>{value}</Text>:null; }
function Line({ label,value }: { label:string; value:string }) { return <View style={s.line}><Text style={s.copy}>{label}</Text><Text style={s.value}>{value}</Text></View>; }
function money(value:string|null,hidden:boolean) { return hidden?'••••':value===null?'Unavailable':`${value.replace(/\.000000$/,'')} USDC`; }
function date(value:string) { return new Date(value).toLocaleString(); }
function VaultCard({ vault,hidden }: { vault:VaultSummary; hidden:boolean }) {
 return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${vault.name}, ${vault.phase.toLowerCase()}`} onPress={()=>router.push({ pathname:'/vaults/[id]',params:{ id:vault.id } })} style={s.card}>
  {vault.bannerUrl?<Image accessibilityLabel={`${vault.name} banner`} source={{ uri:vault.bannerUrl }} style={{ width:'100%',height:120,borderRadius:12 }} />:null}
  <Text style={s.eyebrow}>{vault.phase.replaceAll('_',' ')} · PAPER</Text><Text style={s.cardTitle}>{vault.name}</Text>
  <Text numberOfLines={2} style={s.copy}>{vault.description || 'No strategy description'}</Text>
  <Line label="Accepted capital" value={money(vault.acceptedCapitalUsdc,hidden)} />
  <Line label="Duration" value={`${vault.durationDays} days · ${vault.durationDays<30?'Short':'Long'}`} />
  <Text style={s.copy}>{vault.participants} participants · Funding closes {date(vault.fundingClosesAt)}</Text>
 </Pressable>;
}
export function VaultListScreen() {
 const { mine }=useLocalSearchParams<{ mine?:string }>();
 const [durationGroup,setDurationGroup]=useState<'all'|'short'|'long'>('all');
 const data=useVaults(undefined,mine==='1',durationGroup),{ settings,ready }=useAccountSettings();
 const hidden=!ready||settings.hideBalances;
 return <Frame title={mine==='1'?'Your vault rounds':'Discover vaults'}><SailingRefresh refreshing={data.loading} onRefresh={data.refresh}>{scrollProps => <FlatList {...scrollProps} data={data.vaults} keyExtractor={v=>v.id}
  contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" renderItem={({ item })=><VaultCard vault={item} hidden={hidden} />}
  ListHeaderComponent={<View style={s.section}>
   {!data.config?.walletSnapshotEnabled?<Action secondary onPress={()=>router.push('/vaults/live')}>Your wallet-funded vaults</Action>:null}
   <View style={s.row}>{(['all','short','long'] as const).map(group=><Pressable key={group} accessibilityRole="radio" accessibilityState={{ checked:durationGroup===group }} onPress={()=>setDurationGroup(group)} style={[s.chip,durationGroup===group&&s.chosen]}><Text style={durationGroup===group?s.buttonText:s.copy}>{group==='all'?'All durations':group==='short'?'Under 30 days':'30 days or more'}</Text></Pressable>)}</View>
   <Text style={s.copy}>Fixed funding windows. Transparent paper trading. Capital locked until settlement.</Text>
   <View style={s.row}><Action secondary onPress={()=>router.replace({ pathname:'/vaults',params:{ mine:mine==='1'?'0':'1' } })}>{mine==='1'?'Discover':'Your rounds'}</Action>
   <Action onPress={()=>router.push('/vaults/create')}>Create vault</Action></View>
   <Text style={s.caption}>{data.connected?'Live updates connected':'Refreshing periodically'} · Paper USDC has no redemption value</Text><ErrorText value={data.error} />
  </View>} ListEmptyComponent={data.status==='loading'?<CardSkeleton label="Loading vaults…" count={2}/>:data.error?<View style={s.card}><Text style={s.cardTitle}>Could not load vaults</Text><Action secondary onPress={data.refresh}>Retry</Action></View>:data.status==='success'?<View style={s.card}><Text style={s.cardTitle}>No vault rounds yet</Text><Text style={s.copy}>Funded vaults appear here after creation is confirmed.</Text><Action secondary onPress={data.refresh}>Refresh</Action></View>:null}
  ListFooterComponent={data.paging?<ShipLoader compact label="Loading more vaults…"/>:data.nextCursor?<Action secondary onPress={()=>{ void data.loadMore(); }}>Load more vaults</Action>:null} />}</SailingRefresh>
 </Frame>;
}
export function VaultHomePanel({ isCaptain }:{ isCaptain:boolean }) {
 const data=useVaults(undefined,true),{ settings,ready }=useAccountSettings();
 useHomeRefreshSource(data.refresh,data.loading);
 return <View style={s.content}><Text style={s.cardTitle}>{isCaptain?'Lead your next round.':'Your vault investments.'}</Text>
  {!data.config?.walletSnapshotEnabled?<Action secondary onPress={()=>router.push('/vaults/live')}>Your wallet-funded vaults</Action>:null}
  <Text style={s.copy}>Your funded paper rounds and final claims.</Text><ErrorText value={data.error} />
  {data.status==='loading'&&!data.vaults.length?<CardSkeleton label="Loading vault investments…"/>:null}
  {data.error?<Action secondary onPress={data.refresh}>Retry loading investments</Action>:null}
  {data.status==='success'&&!data.error&&!data.vaults.length?<View style={s.card}><Text style={s.copy}>No paper vault investments yet. {isCaptain?'Create your first paper strategy with virtual funds based on your devnet wallet.':'Explore vaults accepting contributions.'}</Text></View>:null}
  {data.vaults.slice(0,5).map(v=><VaultCard key={v.id} vault={v} hidden={!ready||settings.hideBalances} />)}
  <Action onPress={()=>router.push(isCaptain?'/vaults/create':'/vaults')}>{isCaptain?'Create a vault':'Explore vaults'}</Action>
  <Action secondary onPress={()=>router.push({ pathname:'/vaults',params:{ mine:'1' } })}>All your rounds</Action>
 </View>;
}
export { VaultCreateScreen } from './vault-create-screen';
export { VaultDetailScreen } from './vault-detail-screen';
const s=StyleSheet.create({
 root:{ flex:1,backgroundColor:C.surface },header:{ flexDirection:'row',alignItems:'center',gap:16,padding:16 },heading:{ flex:1,fontFamily:InterFont.semiBold,fontSize:18,color:C.ink },
 content:{ padding:20,gap:16,maxWidth:600,width:'100%',alignSelf:'center',paddingBottom:40 },section:{ gap:12 },card:{ padding:20,borderRadius:C.bodyRadius,backgroundColor:C.body,borderWidth:1,borderColor:C.bodyBorder,gap:14 },
 cardTitle:{ fontFamily:BrandFont.editorial,fontSize:26,color:C.ink },copy:{ fontFamily:InterFont.regular,fontSize:14,lineHeight:22,color:C.ink,flexShrink:1 },caption:{ fontFamily:InterFont.regular,fontSize:12,lineHeight:19,color:C.secondary },
 eyebrow:{ fontFamily:InterFont.semiBold,fontSize:11,letterSpacing:1,color:C.secondary },label:{ fontFamily:InterFont.semiBold,fontSize:14,color:C.ink },value:{ fontFamily:InterFont.medium,fontSize:14,color:C.ink,fontVariant:['tabular-nums'],flexShrink:1,textAlign:'right' },
 line:{ flexDirection:'row',justifyContent:'space-between',gap:12,flexWrap:'wrap' },row:{ flexDirection:'row',gap:8,flexWrap:'wrap' },input:{ minHeight:52,padding:14,borderWidth:1,borderColor:C.handle,borderRadius:14,fontFamily:InterFont.regular,fontSize:16,color:C.ink,backgroundColor:C.body },multiline:{ minHeight:100,textAlignVertical:'top' },
 button:{ minHeight:48,paddingHorizontal:16,paddingVertical:12,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:C.ink },buttonText:{ fontFamily:InterFont.semiBold,fontSize:14,color:C.actionText },secondary:{ backgroundColor:C.periodSelected },secondaryText:{ color:C.ink },dim:{ opacity:0.5 },error:{ color:C.negative,fontFamily:InterFont.medium,fontSize:13,lineHeight:21 },
 chip:{ minHeight:44,paddingHorizontal:14,paddingVertical:12,borderRadius:14,backgroundColor:C.periodSelected,alignItems:'center',justifyContent:'center' },chosen:{ backgroundColor:C.ink },
});
