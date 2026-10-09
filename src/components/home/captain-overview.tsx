import { useCallback, useState } from 'react';
import { Users } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { selectionFeedback } from '@/components/shared/feedback';
import { FundVaultIcon } from '@/components/shared/icons/product-icons';
import { AuthButton } from '@/components/shared/motion';
import { useCaptainDashboard } from '@/hooks/use-captain-dashboard';
import type { CaptainRange } from '@/api/captain-dashboard';
import { formatUsdc } from '@/api/wallet';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C, DiscoverPalette as D } from '@/constants/theme';
import { HomePerformanceCard } from './home-performance-card';
import { CaptainActions } from './captain-home-sections';
import { CaptainEmptyState } from './captain-empty-state';
import { CaptainLiveDetails } from './captain-live-details';
import type { CaptainPanel } from './captain-home-types';

export function CaptainOverview({ compact, heroSpace, panel, onPanel }: {
 compact:boolean;heroSpace:number;panel:CaptainPanel|null;onPanel:(panel:CaptainPanel|null)=>void;
}) {
 const router=useRouter();
 const { settings,ready,saving,updateSettings }=useAccountSettings();
 const [period,setPeriod]=useState<CaptainRange>('30D');
 const data=useCaptainDashboard(period,panel?.kind??null),d=data.dashboard,p=data.performance;
 const refresh=data.refresh;
 useFocusEffect(useCallback(()=>{refresh();},[refresh]));
 const [locallyHidden,setLocallyHidden]=useState(false),[error,setError]=useState<string|null>(null);
 const hidden=!ready||settings.hideBalances||locallyHidden;
 const money=(v:string|null|undefined)=>v==null?'—':`$${formatUsdc(v)}`;
 function openVault(id:string){onPanel(null);router.push({pathname:'/vaults/[id]',params:{id}});}
 function showPanel(next:CaptainPanel){selectionFeedback();if(next.kind==='create'){onPanel(null);router.push('/vaults/create');}else if(next.kind==='manage'){onPanel(next);}else if('id' in next)openVault(next.id);else onPanel(next);}
 async function toggleBalances(){
  if(!ready||saving)return;const next=!hidden;if(next)setLocallyHidden(true);setError(null);
  try{await updateSettings({hideBalances:next});setLocallyHidden(false);}catch{setError(next?'Hidden here. Your preference couldn’t be saved.':'Couldn’t show balances. Try again.');}
 }
 const points=p?.points??[],validHistory=points.length>=2&&points.every(point=>point.aumUsdc!==null);
 return <View testID="captain-home">
  <View style={[styles.hero,{minHeight:heroSpace}]}><Text accessibilityRole="header" style={[styles.title,compact&&styles.compactTitle]}>Lead the{'\n'}voyage.</Text><Text style={styles.copy}>Trade. Grow. Build your Crew.</Text></View>
  {!d?<View testID="captain-dashboard-status"><Text style={styles.copy} accessibilityRole={data.error?'alert':undefined}>{data.error??'Loading your Captain dashboard…'}</Text>{data.error?<AuthButton accessibilityRole="button" onPress={data.refresh} style={{minHeight:44,justifyContent:'center'}}><Text style={styles.copy}>Retry</Text></AuthButton>:null}</View>:d.state==='NEW'?<CaptainEmptyState onCreate={()=>showPanel({kind:'create'})}/>:<>
   <HomePerformanceCard variant="frosted" badge="Paper" label="Assets under management" balance={money(d.aumUsdc)}
    change={p?.changeUsdc==null?'Change unavailable':`${Number(p.changeUsdc)>=0?'+':'−'}${money(p.changeUsdc.replace('-',''))}${p.changePercent===null?'':` (${Number(p.changePercent)>=0?'+':''}${Number(p.changePercent).toFixed(2)}%)`}`}
    positive={Number(p?.changeUsdc??0)>=0} changeCaption={`AUM change · ${period==='ALL'?'all time':period}`}
    values={validHistory?points.map(point=>Number(point.aumUsdc)):[]} timestamps={validHistory?points.map(point=>point.at):undefined} chartDescription="Recorded assets under management across your open vaults. Includes capital flows."
    chartMessage={!validHistory?data.loading?'Loading AUM history…':points.some(point=>point.aumUsdc===null)?'Some valuations are unavailable. Refresh to try again.':'Your AUM chart will appear as vault history builds.':undefined}
    metrics={[{label:'Active vaults',value:String(d.activeVaults),testID:'captain-active-vaults',icon:<FundVaultIcon size={18} color={C.icon}/>},{label:'Crew members',value:String(d.crewMembers),icon:<Users size={19} color={C.icon}/>} ]}
    hidden={hidden} canToggle={ready&&!saving} onToggle={()=>{void toggleBalances();}} onOverview={()=>showPanel({kind:'overview'})} overviewLabel="View assets under management breakdown"
    period={period} onPeriod={value=>{selectionFeedback();setPeriod(value);}} compact={compact} error={error??data.error??(d.valuationStatus==='UNAVAILABLE'?'Current AUM is unavailable.':null)}
    testIDPrefix="captain" summaryTestID="captain-aum-card" balanceTestID="captain-aum-value" changeTestID="captain-aum-change" overviewTestID="captain-overview"/>
   {p?.coverage==='PARTIAL'&&points.length>0?<Text style={[styles.copy,{fontSize:11,marginTop:8}]}>Recorded history from {new Date(points[0].at).toLocaleDateString()} · AUM includes capital flows.</Text>:null}
   {data.error?<AuthButton accessibilityRole="button" onPress={data.refresh} style={{minHeight:44,justifyContent:'center'}}><Text style={styles.copy}>Retry dashboard</Text></AuthButton>:null}
   <CaptainActions dashboard={d} hidden={hidden} compact={compact} onPanel={showPanel}/>
  </>}
  {d&&d.state==='NEW'&&data.error?<Text accessibilityRole="alert" style={styles.copy}>{data.error}</Text>:null}
  <CaptainLiveDetails panel={panel} data={data} hidden={hidden} onClose={()=>onPanel(null)} onVault={openVault}/>
 </View>;
}

const styles = StyleSheet.create({
  hero: { paddingTop: 25, paddingBottom: 28, paddingHorizontal: 3 },
  title: { fontFamily: BrandFont.editorial, fontSize: 40, lineHeight: 40, letterSpacing: -0.4, color: D.ink },
  compactTitle: { fontSize: 34, lineHeight: 35 },
  copy: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.ink, marginTop: 10 },
});
