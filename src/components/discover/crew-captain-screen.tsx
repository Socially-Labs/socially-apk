import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { useCallback,useState } from 'react';
import { ScrollView,Text,View } from 'react-native';
import { router,useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft,ArrowRight,Users,Layers,Info } from 'lucide-react-native';
import { fetchCrewCaptain,fetchDiscoveryVaults,type CrewRange } from '@/api/crew-discovery';
import type { VaultSummary } from '@/api/vaults';
import { freshnessLabel,portfolioPercent } from '@/api/captain-portfolio-display';
import { CaptainExperienceBadge } from './captain-experience-badge';
import { CaptainPortfolioChart } from '@/components/home/captain-portfolio-chart';
import { AuthButton } from '@/components/shared/motion';
import { DiscoverPalette as D } from '@/constants/theme';
import { DiscoveryAvatar,DiscoveryBanner } from './crew-discovery-media';
import { CrewVaultCard,DiscoveryStat,discoveryUsdc } from './crew-discover-screen';
import { crewStyles as s } from './crew-discovery-styles';

export default function CrewCaptainScreen({id}:{id:string}){
 const insets=useSafeAreaInsets();const [range,setRange]=useState<CrewRange>('30D'),[revision,setRevision]=useState(0);
 const scope=`${id}:${range}`;
 const [state,setState]=useState<{scope:string;data:Awaited<ReturnType<typeof fetchCrewCaptain>>|null;vaults:VaultSummary[];loading:boolean;vaultLoading:boolean;error:string|null;vaultError:string|null}>({scope:'',data:null,vaults:[],loading:true,vaultLoading:true,error:null,vaultError:null});
 useFocusEffect(useCallback(()=>{
  void revision;const controller=new AbortController();
  setState(old=>({scope,data:old.scope===scope?old.data:null,vaults:old.scope===scope?old.vaults:[],loading:true,vaultLoading:true,error:null,vaultError:null}));
  void fetchCrewCaptain(id,range,controller.signal).then(data=>{if(!controller.signal.aborted)setState(v=>({...v,data,loading:false}));}).catch(e=>{if(!controller.signal.aborted)setState(v=>({...v,loading:false,error:e instanceof Error?e.message:'Could not load Captain.'}));});
  void fetchDiscoveryVaults('',{phase:'ALL',duration:'all'},id,null,controller.signal).then(page=>{if(!controller.signal.aborted)setState(v=>({...v,vaults:page.items,vaultLoading:false}));}).catch(e=>{if(!controller.signal.aborted)setState(v=>({...v,vaultLoading:false,vaultError:e instanceof Error?e.message:'Could not load vaults.'}));});
  return()=>controller.abort();
 },[id,range,scope,revision]));
 const current=state.scope===scope?state:null,data=current?.data,captain=data?.captain,p=data?.portfolio;
 const explore=()=>router.navigate({pathname:'/explore',params:{tab:'vaults',captainId:id}});
 return <View style={s.screen} testID="crew-captain-profile"><ScrollView contentContainerStyle={{paddingBottom:Math.max(insets.bottom+26,40)}}>
  <View style={{width:'100%',maxWidth:560,alignSelf:'center'}}>
   {captain?<DiscoveryBanner uri={captain.bannerUrl} identity={id} height={210}/>:<View style={{height:100}}/>}
   <AuthButton accessibilityRole="button" accessibilityLabel="Back to Discover" onPress={()=>router.canGoBack()?router.back():router.replace('/explore')} style={[s.icon,{position:'absolute',left:12,top:Math.max(insets.top+8,12),backgroundColor:'rgba(255,255,255,0.7)',borderRadius:24}]}><ArrowLeft size={21} color={D.ink}/></AuthButton>
  </View>
  <View style={[s.content,{gap:18}]}>
  {current?.error?<View style={s.empty}><Text accessibilityRole="alert" style={s.error}>{current.error}</Text><AuthButton onPress={()=>setRevision(v=>v+1)} accessibilityRole="button" style={s.action}><Text style={s.actionText}>Retry</Text></AuthButton></View>:null}
  {(!current||current.loading)&&!data?<ShipLoader label="Loading captain…"/>:null}
  {current&&captain&&p?<>
   <View style={{gap:12}}>
    <View style={[s.identity,{marginTop:-42,gap:14}]}><DiscoveryAvatar uri={captain.avatarUrl} identity={id} size={94}/><View style={[s.identityCopy,{paddingTop:38}]}><Text style={[s.name,{fontSize:29,lineHeight:32}]}>{captain.displayName||captain.username}</Text><Text style={[s.body,{color:D.ink}]}>@{captain.username}</Text></View></View>
    <CaptainExperienceBadge captain={captain}/>
    {captain.bio?<Text style={[s.body,{color:D.ink,fontSize:13}]}>{captain.bio}</Text>:null}
    <View style={[s.row,{gap:20}]}><View style={[s.row,{gap:6}]}><Users size={15} color={D.secondary}/><Text style={s.label}>{captain.crewMembers} in Crew</Text></View><View style={[s.row,{gap:6}]}><Layers size={15} color={D.secondary}/><Text style={s.label}>{p.activeVaults} active vaults</Text></View></View>
   </View>
   <View style={s.chartPanel} testID="crew-captain-performance">
    <View style={s.between}><Text style={s.sectionTitle}>Performance</Text><Text style={s.note}>{captain.isDemo?'Simulated demo':'Paper trading'}</Text></View>
    <View style={s.ranges}>{(['7D','30D','90D','ALL'] as const).map(r=><AuthButton key={r} testID={`crew-performance-${r}`} accessibilityRole="button" accessibilityState={{selected:range===r}} onPress={()=>setRange(r)} style={[s.range,range===r&&s.selected]}><Text style={[s.label,range===r&&s.selectedText]}>{r==='ALL'?'All':r}</Text></AuthButton>)}</View>
    <View style={s.row}>
     <View style={s.metric}><Text style={s.body}>{range==='ALL'?'All-time':range} net return</Text><Text style={[s.bigReturn,p.netReturnPercent?.startsWith('-')&&{color:D.negative}]}>{portfolioPercent(p.netReturnPercent)}</Text></View>
     <View style={s.metric}><Text style={s.body}>Max drawdown</Text><Text style={[s.bigReturn,{color:D.negative}]}>{data.maxDrawdownPercent===null?'—':`−${Number(data.maxDrawdownPercent).toFixed(1)}%`}</Text></View>
    </View>
    <CaptainPortfolioChart points={p.points} hidden={false} loading={current.loading} unavailable={p.points.length===0} height={150} color={p.netReturnPercent?.startsWith('-')?D.negative:D.positive}/>
    <View style={s.stats}><DiscoveryStat value={discoveryUsdc(p.aumUsdc)} label="AUM"/><DiscoveryStat value={String(captain.crewMembers)} label="Crew"/><DiscoveryStat value={String(p.activeVaults)} label="Active vaults"/><DiscoveryStat value={p.coverage==='COMPLETE'?'Complete':p.coverage==='PARTIAL'?'Partial':'Unavailable'} label="Recorded coverage" last/></View>
    <Text style={[s.note,{textAlign:'right'}]}>Net of assessed fees · {freshnessLabel(p)}</Text>
   </View>
   <View style={[s.row,{alignItems:'flex-start',backgroundColor:D.accentTint,padding:14,borderRadius:12,borderWidth:1,borderColor:D.line}]}><Info size={20} color={D.ink}/><View style={{flex:1,gap:4}}><Text style={[s.label,{color:D.ink}]}>Portfolio performance, not your personal return</Text><Text style={s.note}>This shows {captain.displayName||captain.username}’s public paper trading performance. Your returns may differ based on which vaults you join, timing and fees.</Text></View></View>
   <AuthButton testID="crew-captain-explore-vaults" accessibilityRole="button" onPress={explore} style={s.primary}><Text style={s.primaryText}>Explore vaults</Text><ArrowRight size={19} color={D.heroInk}/></AuthButton>
   <View style={s.between}><Text style={s.sectionTitle}>Vaults ({p.totalVaults})</Text><AuthButton accessibilityRole="button" onPress={explore} style={s.action}><Text style={s.actionText}>View all</Text></AuthButton></View>
   {current.vaultError?<Text style={s.error}>{current.vaultError}</Text>:null}
   {current.vaults.slice(0,3).map(v=><CrewVaultCard key={v.id} vault={v}/>)}
   {current.vaultLoading&&!current.vaults.length?<ShipLoader compact label="Loading captain vaults…"/>:null}
   {!current.vaultLoading&&!current.vaults.length&&!current.vaultError?<Text style={s.body}>No vaults published yet.</Text>:null}
  </>:null}
  </View>
 </ScrollView></View>;
}
