import { PaperBalanceSetup } from './paper-balance-setup';
import { VaultArtwork } from './vault-artwork';
import { RoundTerms } from './vault-round-terms';
import { useCallback,useState,type ReactNode } from 'react';
import { Image,ActivityIndicator,FlatList,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View } from 'react-native';
import { router,useFocusEffect,useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVaults } from '@/hooks/use-vaults';
import { useVaultIntent } from '@/hooks/use-vault-intent';
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
 return <Frame title={mine==='1'?'Your vault rounds':'Discover vaults'}><FlatList data={data.vaults} keyExtractor={v=>v.id}
  contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" renderItem={({ item })=><VaultCard vault={item} hidden={hidden} />}
  refreshing={data.loading} onRefresh={data.refresh} ListHeaderComponent={<View style={s.section}>
   {!data.config?.walletSnapshotEnabled?<Action secondary onPress={()=>router.push('/vaults/live')}>Your wallet-funded vaults</Action>:null}
   <View style={s.row}>{(['all','short','long'] as const).map(group=><Pressable key={group} accessibilityRole="radio" accessibilityState={{ checked:durationGroup===group }} onPress={()=>setDurationGroup(group)} style={[s.chip,durationGroup===group&&s.chosen]}><Text style={durationGroup===group?s.buttonText:s.copy}>{group==='all'?'All durations':group==='short'?'Under 30 days':'30 days or more'}</Text></Pressable>)}</View>
   <Text style={s.copy}>Fixed funding windows. Transparent paper trading. Capital locked until settlement.</Text>
   <View style={s.row}><Action secondary onPress={()=>router.replace({ pathname:'/vaults',params:{ mine:mine==='1'?'0':'1' } })}>{mine==='1'?'Discover':'Your rounds'}</Action>
   <Action onPress={()=>router.push('/vaults/create')}>Create vault</Action></View>
   <Text style={s.caption}>{data.connected?'Live updates connected':'Refreshing periodically'} · Paper USDC has no redemption value</Text><ErrorText value={data.error} />
  </View>} ListEmptyComponent={<View style={s.card}>{data.loading?<ActivityIndicator color={C.ink} />:null}<Text style={s.cardTitle}>{data.loading?'Loading vaults…':'No vault rounds yet'}</Text><Text style={s.copy}>Funded vaults appear here after the backend confirms creation.</Text><Action secondary onPress={data.refresh}>Refresh</Action></View>}
  ListFooterComponent={data.nextCursor?<Action secondary onPress={()=>{ void data.loadMore(); }}>Load more vaults</Action>:null} />
 </Frame>;
}
export function VaultHomePanel({ isCaptain }:{ isCaptain:boolean }) {
 const data=useVaults(undefined,true),{ settings,ready }=useAccountSettings();
 return <View style={s.content}><Text style={s.cardTitle}>{isCaptain?'Lead your next round.':'Your vault investments.'}</Text>
  {!data.config?.walletSnapshotEnabled?<Action secondary onPress={()=>router.push('/vaults/live')}>Your wallet-funded vaults</Action>:null}
  <Text style={s.copy}>Your funded paper rounds and final claims.</Text><ErrorText value={data.error} />
  {data.loading&&!data.vaults.length?<ActivityIndicator color={C.ink} />:null}
  {!data.loading&&!data.vaults.length?<View style={s.card}><Text style={s.copy}>No paper vault investments yet. {isCaptain?'Create your first paper strategy with virtual funds based on your devnet wallet.':'Explore vaults accepting contributions.'}</Text></View>:null}
  {data.vaults.slice(0,5).map(v=><VaultCard key={v.id} vault={v} hidden={!ready||settings.hideBalances} />)}
  <Action onPress={()=>router.push(isCaptain?'/vaults/create':'/vaults')}>{isCaptain?'Create a vault':'Explore vaults'}</Action>
  <Action secondary onPress={()=>router.push({ pathname:'/vaults',params:{ mine:'1' } })}>All your rounds</Action>
 </View>;
}
export { VaultCreateScreen } from './vault-create-screen';
export function VaultDetailScreen() {
 const params=useLocalSearchParams<{ id:string }>(),id=typeof params.id==='string'?params.id:'';
 const data=useVaults(id),vault=data.vault,position=data.position;
 const { settings,ready }=useAccountSettings(),hidden=!ready||settings.hideBalances;
 const [amount,setAmount]=useState('50'),[review,setReview]=useState(false),[localError,setLocalError]=useState<string|null>(null);
 const intent=useVaultIntent(data.api,data.subject,`vault:${id}`,()=>{ setReview(false); data.refresh(); });
 const [now,setNow]=useState(()=>Date.now());
 useFocusEffect(useCallback(()=>{ const timer=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(timer); },[]));
 const fresh=!!data.refreshedAt && now-data.refreshedAt<90_000 && !data.error && !data.privateError;
 const serverNow=vault?Date.parse(vault.serverTime)+(data.refreshedAt?now-data.refreshedAt:0):0;
 const funding=!!vault && vault.phase==='FUNDRAISING' && serverNow<Date.parse(vault.fundingClosesAt);
 const saved=intent.attempt?.intent;
 const canAct=intent.ready&&!intent.busy&&fresh;
 const submitContribution=async()=>{
  if (!vault) return;
  setLocalError(null);
  try { const quote=await data.api.quote(id,{ amountUsdc:amount,termsHash:vault.termsHash });
   if (!quote.allowed) throw new Error(quote.reason==='capacity_exceeded'?'This vault has insufficient remaining capacity. Your amount has been kept.':`Contribution unavailable: ${quote.reason}`);
   setReview(true);
  } catch (error) { setLocalError(error instanceof Error?error.message:'Could not quote contribution.'); data.refresh(); }
 };
 return <Frame title={vault?.name ?? 'Vault round'}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  {data.loading&&!vault?<ActivityIndicator color={C.ink} />:null}<ErrorText value={data.error} /><ErrorText value={data.privateError} /><ErrorText value={intent.error} /><ErrorText value={localError} />
  <Action secondary onPress={data.refresh}>Refresh vault</Action>
  {vault?<>
   <View style={s.card}>
    {vault.bannerUrl?<Image accessibilityLabel="Vault banner" source={{ uri:vault.bannerUrl }} style={{ width:'100%',height:140,borderRadius:12 }} />:null}
    {vault.avatarUrl?<Image accessibilityLabel="Vault image" source={{ uri:vault.avatarUrl }} style={{ width:64,height:64,borderRadius:16 }} />:null}
    <Text style={s.eyebrow}>{vault.phase} · {vault.riskState} · PAPER</Text><Text style={s.copy}>{vault.description}</Text>
    <Line label="Accepted funding" value={money(vault.acceptedCapitalUsdc,hidden)} /><Line label="Remaining capacity" value={money(vault.remainingCapacityUsdc,hidden)} />
    <Line label="Vault value" value={money(vault.navUsdc,hidden)} /><Text style={s.caption}>{vault.valuationStatus==='CURRENT'?`Valued ${vault.valuedAt?date(vault.valuedAt):'recently'}`:'Valuation unavailable · last known values may be stale'}</Text>
    <Text style={s.copy}>Funding closes {date(vault.fundingClosesAt)}{ '\n' }Trading starts {date(vault.tradingStartsAt)}{ '\n' }Trading ends {date(vault.tradingEndsAt)}</Text>
    {vault.blockedReason?<Text style={s.copy}>Settlement is waiting: {vault.blockedReason.replaceAll('_',' ')}.</Text>:null}
    {vault.settlement?<><Line label="Final Captain fee" value={money(vault.settlement.captainFeeUsdc,hidden)} /><Line label="Final distribution pool" value={money(vault.settlement.distributionPoolUsdc,hidden)} /></>:null}
    <Text style={s.caption}>{data.connected?'Live updates connected':'Periodic refresh active'}</Text>
   </View>
   {position?<View style={s.card}><Text style={s.cardTitle}>Your investment</Text><Line label="Available paper balance" value={money(position.availableUsdc,hidden)} /><Line label="Accepted principal" value={money(position.contributedUsdc,hidden)} />
    <Line label="Investment value" value={money(position.investmentValueUsdc,hidden)} /><Line label="Investment P&L" value={money(position.personalPnlUsdc,hidden)} /><Line label="Captain fee income" value={money(position.captainFeeUsdc,hidden)} />
    <Line label="Economic shares" value={hidden?'••••':position.shares} /><Line label="Final claim" value={position.claimPaid?'Paid':money(position.claimableUsdc,hidden)} />
    {position.claimableUsdc!==null&&!position.claimPaid&&position.shares!=='0.000000'?<Action disabled={!canAct} onPress={()=>{ void intent.submit({ kind:'CLAIM',vaultId:id,body:{} }); }}>Claim final payout / refund</Action>:null}
    {funding&&position.shares!=='0.000000'?<Action secondary disabled={!canAct} onPress={()=>{ void intent.submit({ kind:'CANCEL',vaultId:id,body:{} }); }}>{position.isCaptain?'Cancel before any Crew commitment':'Cancel full funding contribution'}</Action>:null}
   </View>:null}
   {data.config?.walletSnapshotEnabled&&funding&&position&&!position.isCaptain&&position.availableUsdc==='0.000000'?<PaperBalanceSetup onReady={data.refresh}/>:null}
   {saved?<View style={s.card}><Text style={s.cardTitle}>Request awaiting confirmation</Text><Text style={s.copy}>{saved.kind} · Your original request is saved. Retry confirms that same request.</Text><Action disabled={!intent.ready||intent.busy} onPress={()=>{ void intent.submit(saved); }}>{intent.busy?'Confirming…':'Retry saved request'}</Action></View>:funding&&position&&!position.isCaptain?<View style={s.card}>
    <Text style={s.label}>Contribution in paper USDC</Text>
    {Number(vault.remainingCapacityUsdc)<50?<Text style={s.copy}>Remaining capacity is below the 50 USDC minimum. No smaller final contribution is accepted.</Text>:null}<TextInput accessibilityLabel="Contribution in paper USDC" keyboardType="decimal-pad" value={amount} onChangeText={value=>{ setAmount(value); setReview(false); }} style={s.input} editable={!intent.busy} maxLength={30} />
    {review?<><Text style={s.copy}>Invest {amount} paper USDC at 1 USDC per economic share. Capital is locked from the funding deadline until settlement. The amount is checked again when submitted.</Text><Action disabled={!canAct} onPress={()=>{ void intent.submit({ kind:'CONTRIBUTE',vaultId:id,body:{ amountUsdc:amount,termsHash:vault.termsHash } }); }}>{intent.busy?'Confirming…':'Confirm contribution'}</Action></>:<Action disabled={!canAct} onPress={()=>{ void submitContribution(); }}>Review contribution</Action>}
   </View>:null}
   {position?.isCaptain?<View style={s.card}><VaultArtwork key={`${data.subject}:${id}`} api={data.api} id={id} onSaved={data.refresh} /></View>:null}
   {vault.phase==='ACTIVE'&&position?.isCaptain?<Action onPress={()=>router.push({pathname:'/explore',params:{vaultId:id}})}>Open trading markets</Action>:null}
   <View style={s.card}><Text style={s.cardTitle}>Round terms</Text><RoundTerms universeMode={vault.universeMode} /><Text selectable style={s.caption}>Terms v{vault.termsVersion} · {vault.termsHash}</Text></View>
  </>:!data.loading?<Text style={s.copy}>This vault is unavailable. Check the link or return to Discover.</Text>:null}
 </ScrollView></Frame>;
}
const s=StyleSheet.create({
 root:{ flex:1,backgroundColor:C.surface },header:{ flexDirection:'row',alignItems:'center',gap:16,padding:16 },heading:{ flex:1,fontFamily:InterFont.semiBold,fontSize:18,color:C.ink },
 content:{ padding:20,gap:16,maxWidth:600,width:'100%',alignSelf:'center',paddingBottom:40 },section:{ gap:12 },card:{ padding:20,borderRadius:C.bodyRadius,backgroundColor:C.body,borderWidth:1,borderColor:C.bodyBorder,gap:14 },
 cardTitle:{ fontFamily:BrandFont.editorial,fontSize:26,color:C.ink },copy:{ fontFamily:InterFont.regular,fontSize:14,lineHeight:22,color:C.ink,flexShrink:1 },caption:{ fontFamily:InterFont.regular,fontSize:12,lineHeight:19,color:C.secondary },
 eyebrow:{ fontFamily:InterFont.semiBold,fontSize:11,letterSpacing:1,color:C.secondary },label:{ fontFamily:InterFont.semiBold,fontSize:14,color:C.ink },value:{ fontFamily:InterFont.medium,fontSize:14,color:C.ink,fontVariant:['tabular-nums'],flexShrink:1,textAlign:'right' },
 line:{ flexDirection:'row',justifyContent:'space-between',gap:12,flexWrap:'wrap' },row:{ flexDirection:'row',gap:8,flexWrap:'wrap' },input:{ minHeight:52,padding:14,borderWidth:1,borderColor:C.handle,borderRadius:14,fontFamily:InterFont.regular,fontSize:16,color:C.ink,backgroundColor:C.body },multiline:{ minHeight:100,textAlignVertical:'top' },
 button:{ minHeight:48,paddingHorizontal:16,paddingVertical:12,borderRadius:24,alignItems:'center',justifyContent:'center',backgroundColor:C.ink },buttonText:{ fontFamily:InterFont.semiBold,fontSize:14,color:C.actionText },secondary:{ backgroundColor:C.periodSelected },secondaryText:{ color:C.ink },dim:{ opacity:0.5 },error:{ color:C.negative,fontFamily:InterFont.medium,fontSize:13,lineHeight:21 },
 chip:{ minHeight:44,paddingHorizontal:14,paddingVertical:12,borderRadius:14,backgroundColor:C.periodSelected,alignItems:'center',justifyContent:'center' },chosen:{ backgroundColor:C.ink },
});
