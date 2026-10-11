import { useHomeRefreshSource } from './home-refresh-provider';
import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { selectionFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { useCaptainDashboard } from '@/hooks/use-captain-dashboard';
import type { CaptainRange } from '@/api/captain-dashboard';
import { BrandFont, InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';
import { CaptainPortfolioCard } from './captain-portfolio-card';
import { CaptainActions } from './captain-home-sections';
import { CaptainEmptyState } from './captain-empty-state';
import { CaptainLiveDetails } from './captain-live-details';
import type { CaptainPanel } from './captain-home-types';

export function CaptainOverview({ compact, panel, onPanel }: {
 compact:boolean;panel:CaptainPanel|null;onPanel:(panel:CaptainPanel|null)=>void;
}) {
 const router=useRouter();
 const {height}=useWindowDimensions();
 const short=height<800,tiny=height<720;
 const { settings,ready,saving,updateSettings }=useAccountSettings();
 const [period,setPeriod]=useState<CaptainRange>('7D');
 const data=useCaptainDashboard(period,panel?.kind??null),d=data.dashboard;
 useHomeRefreshSource(data.refresh,data.loading||data.portfolioLoading||data.detailLoading);
 const [locallyHidden,setLocallyHidden]=useState(false),[error,setError]=useState<string|null>(null);
 const hidden=!ready||settings.hideBalances||locallyHidden;
 function openVault(id:string){onPanel(null);router.push({pathname:'/vaults/[id]',params:{id}});}
 function showPanel(next:CaptainPanel){selectionFeedback();if(next.kind==='create'){onPanel(null);router.push('/vaults/create');}else if(next.kind==='manage'){onPanel(next);}else if('id' in next)openVault(next.id);else onPanel(next);}
 async function toggleBalances(){
  if(!ready||saving)return;const next=!hidden;if(next)setLocallyHidden(true);setError(null);
  try{await updateSettings({hideBalances:next});setLocallyHidden(false);}catch{setError(next?'Hidden here. Your preference couldn’t be saved.':'Couldn’t show balances. Try again.');}
 }
 const existing=d?.state==='EXISTING'||(data.portfolio?.totalVaults??0)>0;
 return <View testID="captain-home" style={styles.home}>
  <View style={[styles.hero,short&&height>=680&&styles.shortHero]}>{height>=680?<Text accessibilityRole="header" style={[styles.title,compact&&styles.compactTitle,short&&styles.shortTitle]}>Lead the{short?' ':'\n'}voyage.</Text>:null}{!tiny?<Text style={[styles.copy,short&&styles.shortCopy]}>Trade. Grow. Build your Crew.</Text>:null}</View>
  {existing?<>
   <CaptainPortfolioCard portfolio={data.portfolio} period={period} loading={data.portfolioLoading} hidden={hidden}
    canToggle={ready&&!saving} compact={compact} error={error??data.portfolioError??data.error} onRetry={data.refresh}
    onToggle={()=>{void toggleBalances();}}
    onPeriod={value=>{selectionFeedback();setPeriod(value);}} />
   {d?<CaptainActions dashboard={d} hidden={hidden} compact={compact} onPanel={showPanel}/>:null}
  </>:d?.state==='NEW'?<CaptainEmptyState onCreate={()=>showPanel({kind:'create'})}/>:<View testID="captain-dashboard-status"><Text style={styles.copy} accessibilityRole={data.error?'alert':undefined}>{data.error}</Text>{!data.error&&data.loading?<ShipLoader label="Loading your Captain dashboard…"/>:null}{data.error?<AuthButton accessibilityRole="button" onPress={data.refresh} style={{minHeight:44,justifyContent:'center'}}><Text style={styles.copy}>Retry</Text></AuthButton>:null}</View>}
  {d&&d.state==='NEW'&&data.error?<Text accessibilityRole="alert" style={styles.copy}>{data.error}</Text>:null}
  <CaptainLiveDetails panel={panel} data={data} period={period} onPeriod={setPeriod} hidden={hidden} onClose={()=>onPanel(null)} onVault={openVault}/>
 </View>;
}

const styles = StyleSheet.create({
  home: { flex: 1 },
  hero: { flex: 1, justifyContent:'center', paddingHorizontal: 3 },
  shortHero: { minHeight: 32 },
  shortTitle: { fontSize: 30, lineHeight: 32 },
  shortCopy: { marginTop: 3 },
  title: { fontFamily: BrandFont.editorial, fontSize: 40, lineHeight: 40, letterSpacing: -0.4, color: D.ink },
  compactTitle: { fontSize: 34, lineHeight: 35 },
  copy: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: D.ink, marginTop: 10 },
});
