import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { CardSkeleton } from '@/components/shared/refresh/card-skeleton';
import { SailingRefresh } from '@/components/shared/refresh/sailing-refresh';
import { useEffect, useState } from 'react';
import { FlatList, Keyboard, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { type CrewCaptain, type DiscoveryFilters, type DiscoveryItem } from '@/api/crew-discovery';
import type { VaultSummary } from '@/api/vaults';
import { portfolioMoney,portfolioPercent } from '@/api/captain-portfolio-display';
import { CaptainPortfolioChart } from '@/components/home/captain-portfolio-chart';
import { useCrewDiscovery } from '@/hooks/use-crew-discovery';
import { AuthButton } from '@/components/shared/motion';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { selectionFeedback } from '@/components/shared/feedback';
import { DiscoverPalette as D } from '@/constants/theme';
import { DiscoveryAvatar, DiscoveryBanner } from './crew-discovery-media';
import { CaptainExperienceBadge } from './captain-experience-badge';
import { crewStyles as s } from './crew-discovery-styles';

const defaults:DiscoveryFilters={phase:'ALL',duration:'all',sort:'RECENT'};
const isCaptain=(v:DiscoveryItem):v is CrewCaptain=>'username' in v;
const openCaptain=(id:string)=>{Keyboard.dismiss();router.push({pathname:'/captain/[id]',params:{id}});};
const openVault=(id:string)=>{Keyboard.dismiss();router.push({pathname:'/vaults/[id]',params:{id}});};
export const discoveryUsdc=(value:string|null)=>value===null?'—':`${portfolioMoney(value).replace('$','').replace(/\.00$/, '')} USDC`;
export function DiscoveryStat({value,label,last=false}:{value:string;label:string;last?:boolean}){return <View style={[s.stat,last&&s.lastStat]}><Text style={s.value}>{value}</Text><Text style={s.label}>{label}</Text></View>;}
export function CrewVaultCard({vault}:{vault:VaultSummary & {captainUsername?:string|null}}){
 return <AuthButton accessibilityRole="button" accessibilityLabel={`View ${vault.name}`} testID={`discover-vault-${vault.id}`} onPress={()=>openVault(vault.id)} style={s.card}>
  <View><DiscoveryBanner uri={vault.bannerUrl} identity={vault.id}/><View style={{position:'absolute',right:10,top:10,backgroundColor:D.surface,borderRadius:20,paddingHorizontal:12,paddingVertical:5}}><Text style={s.badgeText}>{vault.phase.toLowerCase().replaceAll('_',' ')}</Text></View></View>
  <View style={s.cardBody}>
   <View style={s.identity}><DiscoveryAvatar uri={vault.avatarUrl} identity={vault.id} size={64} vault/><View style={s.identityCopy}><Text style={[s.name,{fontSize:21}]} numberOfLines={1}>{vault.name}</Text><Text style={s.label}>{vault.captainUsername?`Captain @${vault.captainUsername}`:'Captain profile'}</Text></View></View>
   {vault.description?<Text style={[s.body,{paddingLeft:73}]} numberOfLines={2}>{vault.description}</Text>:null}
   <View style={s.stats}><DiscoveryStat value={String(vault.participants)} label="participants"/><DiscoveryStat value={discoveryUsdc(vault.remainingCapacityUsdc)} label="remaining capacity"/><DiscoveryStat value={`${vault.durationDays} days`} label="duration" last/></View>
  </View>
 </AuthButton>;
}
function CaptainCard({captain}:{captain:CrewCaptain}){return <View style={s.card}>
 <AuthButton accessibilityRole="button" accessibilityLabel={`View @${captain.username}`} testID={`discover-captain-${captain.id}`} onPress={()=>openCaptain(captain.id)}><View><DiscoveryBanner uri={captain.bannerUrl} identity={captain.id}/></View></AuthButton>
 <View pointerEvents="none" style={{position:'absolute',top:10,left:10}}><CaptainExperienceBadge captain={captain}/></View>
 <View style={s.cardBody}>
  <View style={[s.identity,{alignItems:'flex-start',marginTop:-25}]}>
   <AuthButton accessibilityRole="button" accessibilityLabel={`View @${captain.username} performance`} onPress={()=>openCaptain(captain.id)}><DiscoveryAvatar uri={captain.avatarUrl} identity={captain.id} size={78}/></AuthButton>
   <View style={{flex:1,minWidth:0,paddingTop:29,gap:9}}>
    <View style={[s.between,{gap:4,flexWrap:'wrap'}]}>
     <AuthButton accessibilityRole="button" accessibilityLabel={`View @${captain.username} profile`} onPress={()=>openCaptain(captain.id)} style={{flex:1,minWidth:90}}><Text style={[s.name,{fontSize:21,lineHeight:24}]} numberOfLines={1}>{captain.displayName||captain.username}</Text><Text style={s.label}>@{captain.username}</Text></AuthButton>
     <AuthButton accessibilityRole="button" accessibilityLabel={`View @${captain.username} vaults`} onPress={()=>router.navigate({pathname:'/explore',params:{tab:'vaults',captainId:captain.id}})} style={[s.action,{paddingHorizontal:10}]}><Text style={[s.actionText,{fontSize:10}]}>View vaults</Text><ArrowRight size={13} color={D.ink}/></AuthButton>
    </View>
    <View style={s.stats}><View style={[s.stat,{paddingLeft:0,flex:0.8}]}><Text style={[s.value,{color:captain.netReturnPercent==null?D.secondary:captain.netReturnPercent.startsWith('-')?D.negative:D.positive}]}>{portfolioPercent(captain.netReturnPercent)}</Text><Text style={s.label}>30D net return</Text></View><DiscoveryStat value={discoveryUsdc(captain.aumUsdc).replace(/ USDC$/, '')} label="AUM · USDC" last/></View>
   </View>
  </View>
  <View style={{paddingTop:12}} testID={`discover-performance-${captain.id}`}>
   <CaptainPortfolioChart hidden={false} loading={false} unavailable={captain.performance?.valuationStatus==='UNAVAILABLE'} points={captain.performance?.points ?? []} height={80} interactive={false} testID={`discover-chart-${captain.id}`} color={captain.netReturnPercent?.startsWith('-')?D.negative:D.positive}/>
   <View style={[s.between,{paddingTop:6}]}><Text style={s.label}>{captain.crewMembers} crew · {captain.activeVaults} active vaults</Text><Text style={s.label}>{!captain.performance||captain.performance.coverage==='UNAVAILABLE'?'Building history':captain.performance.valuationStatus==='CURRENT'?(captain.isDemo?'Simulated · 30D':'Recorded NAV · 30D'):'Valuation unavailable'}</Text></View>
  </View>
 </View></View>;}
export default function CrewDiscoverScreen(){
 const params=useLocalSearchParams<{tab?:string;captainId?:string}>();
 return <CrewDiscoverContent key={`${params.tab ?? ""}:${params.captainId ?? ""}`}/>;
}
function CrewDiscoverContent(){
 const insets=useSafeAreaInsets();const params=useLocalSearchParams<{tab?:string;captainId?:string}>();
 const captainId=typeof params.captainId==='string'?params.captainId:undefined;
 const [tab,setTab]=useState<'captains'|'vaults'>(params.tab==='vaults'?'vaults':'captains');
 const [sort,setSort]=useState('RETURN');
 const [queries,setQueries]=useState({captains:'',vaults:''}),[query,setQuery]=useState('');
 const [filters,setFilters]=useState<DiscoveryFilters>(defaults),[draft,setDraft]=useState<DiscoveryFilters>(defaults),[sheet,setSheet]=useState(false);
 useEffect(()=>{const timer=setTimeout(()=>setQuery(queries[tab]),250);return()=>clearTimeout(timer);},[queries,tab]);
 const data=useCrewDiscovery(tab,query,filters,tab==='vaults'?captainId:undefined,sort);
 const cards=data.items;
 const active=Number(filters.phase!=='ALL')+Number(filters.duration!=='all')+Number(filters.sort==='AUM');
 function switchTab(next:'captains'|'vaults'){Keyboard.dismiss();selectionFeedback();setQuery(queries[next]);setTab(next);}
 const header=<View style={{gap:14,paddingBottom:14}}>
  <View style={{gap:2}}><Text style={s.title}>Discover</Text><Text style={s.subtitle}>{tab==='captains'?'Invest alongside exceptional people.':'Curated vaults. Real people. Onchain together.'}</Text></View>
  <View style={s.tabs}>{(['captains','vaults'] as const).map(t=><AuthButton key={t} testID={`crew-tab-${t}`} accessibilityRole="tab" accessibilityState={{selected:tab===t}} onPress={()=>switchTab(t)} style={[s.tab,tab===t&&s.activeTab]}><Text style={[s.tabText,tab===t&&{color:D.ink}]}>{t==='captains'?'Captains':'Vaults'}</Text></AuthButton>)}</View>
  <View style={s.row}><View style={s.search}><Search size={18} color={D.secondary}/><TextInput testID="crew-discover-search" accessibilityLabel={tab==='captains'?'Search Captains by username or name':'Search Vaults by name'} placeholder={tab==='captains'?'Search @Toly':'Search vault name'} placeholderTextColor={D.muted} autoCapitalize="sentences" autoCorrect={false} value={queries[tab]} onChangeText={v=>setQueries(q=>({...q,[tab]:v}))} style={s.input}/>{queries[tab]?<AuthButton accessibilityRole="button" accessibilityLabel="Clear search" onPress={()=>setQueries(q=>({...q,[tab]:''}))} style={{minHeight:44,minWidth:30,justifyContent:'center'}}><X size={16} color={D.secondary}/></AuthButton>:null}</View>
   {tab==='vaults'?<AuthButton testID="crew-discover-filters" accessibilityRole="button" accessibilityLabel={`Filter vaults${active?`, ${active} applied`:''}`} onPress={()=>{Keyboard.dismiss();setDraft(filters);setSheet(true);}} style={s.icon}><SlidersHorizontal size={19} color={D.ink}/>{active?<Text style={s.label}>{active}</Text>:null}</AuthButton>:null}
  </View>
  {captainId&&tab==='vaults'?<View style={s.between}><Text style={s.body}>Vaults from this Captain</Text><AuthButton accessibilityRole="button" onPress={()=>router.setParams({captainId:undefined})} style={s.action}><Text style={s.actionText}>All Captains</Text></AuthButton></View>:null}
  {tab==='vaults'?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{(['ALL','FUNDRAISING','ACTIVE'] as const).map(p=><AuthButton key={p} accessibilityRole="button" accessibilityState={{selected:filters.phase===p}} onPress={()=>setFilters(f=>({...f,phase:p}))} style={[s.chip,filters.phase===p&&s.selected]}><Text style={[s.chipText,filters.phase===p&&s.selectedText]}>{p==='ALL'?'All':p==='ACTIVE'?'Active':'Fundraising'}</Text></AuthButton>)}</ScrollView>:<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{[['RETURN','Top performers'],['CREW','Most crew'],['AUM','AUM'],['RECENT','Recent']].map(([value,label])=><AuthButton key={value} accessibilityRole="button" accessibilityState={{selected:sort===value}} onPress={()=>setSort(value)} style={[s.chip,sort===value&&s.selected]}><Text style={[s.chipText,sort===value&&s.selectedText]}>{label}</Text></AuthButton>)}</ScrollView>}
  {data.error?<View style={{gap:8}}><Text accessibilityRole="alert" style={s.error}>{data.error}</Text><AuthButton onPress={data.refresh} accessibilityRole="button" style={s.action}><Text style={s.actionText}>Retry</Text></AuthButton></View>:null}

 </View>;
 return <View style={s.screen} testID="crew-discover"><SailingRefresh key={tab} refreshing={data.loading} onRefresh={data.refresh} topInset={insets.top}>{scrollProps => <FlatList {...scrollProps} key={tab} data={cards} keyExtractor={v=>v.id} renderItem={({item})=><View style={{marginBottom:14}}>{isCaptain(item)?<CaptainCard captain={item}/>:<CrewVaultCard vault={item}/>}</View>}
  ListHeaderComponent={header} contentContainerStyle={[s.content,{paddingTop:Math.max(insets.top+12,40),paddingBottom:Math.max(insets.bottom+110,140),gap:0}]} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}
  onEndReached={()=>{if(!data.error)void data.loadMore();}} onEndReachedThreshold={0.5}
  ListEmptyComponent={data.status==='loading'?<CardSkeleton label={tab==='captains'?'Loading captains…':'Loading vaults…'} count={2}/>:data.error?<View style={s.empty}><Text style={s.sectionTitle}>Discover is unavailable</Text></View>:data.status==='success'?<View style={s.empty}><Text style={s.sectionTitle}>{`No ${tab} found`}</Text><Text style={s.body}>{query?'Try a different search.':tab==='captains'?'Captains will appear here once they set up their profiles.':'Try another phase or duration.'}</Text></View>:null}
  ListFooterComponent={data.loadingMore?<ShipLoader compact label={tab==='captains'?'Loading more captains…':'Loading more vaults…'}/>:data.nextCursor?<AuthButton accessibilityRole="button" onPress={()=>{void data.loadMore();}} style={s.action}><Text style={s.actionText}>Load more</Text></AuthButton>:null}/>}</SailingRefresh>
 <DashboardSheet visible={sheet} title="Filter vaults" onClose={()=>setSheet(false)} footer={<AuthButton testID="crew-apply-filters" onPress={()=>{setFilters(draft);setSheet(false);}} style={s.primary} accessibilityRole="button"><Text style={s.primaryText}>Apply filters</Text></AuthButton>}>
  <View style={{gap:22}}><View style={s.between}><Text style={s.body}>Find a round that fits your timeline.</Text><AuthButton onPress={()=>setDraft(defaults)} accessibilityRole="button" style={s.action}><Text style={s.actionText}>Clear</Text></AuthButton></View>
   <View style={s.filterGroup}><Text style={s.sectionTitle}>Phase</Text><View style={s.filterOptions}>{(['ALL','FUNDRAISING','ACTIVE'] as const).map(p=><AuthButton key={p} onPress={()=>setDraft(d=>({...d,phase:p}))} accessibilityRole="button" accessibilityState={{selected:draft.phase===p}} style={[s.chip,draft.phase===p&&s.selected]}><Text style={[s.chipText,draft.phase===p&&s.selectedText]}>{p==='ALL'?'All':p==='ACTIVE'?'Active':'Fundraising'}</Text></AuthButton>)}</View></View>
   <View style={s.filterGroup}><Text style={s.sectionTitle}>Duration</Text><View style={s.filterOptions}>{(['all','short','long'] as const).map(d=><AuthButton key={d} onPress={()=>setDraft(f=>({...f,duration:d}))} accessibilityRole="button" accessibilityState={{selected:draft.duration===d}} style={[s.chip,draft.duration===d&&s.selected]}><Text style={[s.chipText,draft.duration===d&&s.selectedText]}>{d==='all'?'Any duration':d==='short'?'Under 30 days':'30+ days'}</Text></AuthButton>)}</View></View>
   <View style={s.filterGroup}><Text style={s.sectionTitle}>Sort by</Text><View style={s.filterOptions}>{(['RECENT','AUM'] as const).map(value=><AuthButton key={value} onPress={()=>setDraft(f=>({...f,sort:value}))} accessibilityRole="button" accessibilityState={{selected:draft.sort===value}} style={[s.chip,draft.sort===value&&s.selected]}><Text style={[s.chipText,draft.sort===value&&s.selectedText]}>{value==='RECENT'?'Newest':'AUM'}</Text></AuthButton>)}</View></View>
  </View>
 </DashboardSheet></View>;
}
