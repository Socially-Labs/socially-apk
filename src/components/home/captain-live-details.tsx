import { StyleSheet,Text,View } from 'react-native';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { AuthButton } from '@/components/shared/motion';
import { formatUsdc } from '@/api/wallet';
import { InterFont,BrandFont } from '@/constants/fonts';
import { CaptainHomePalette as C } from '@/constants/theme';
import type { CaptainPanel } from './captain-home-types';
import type { useCaptainDashboard } from '@/hooks/use-captain-dashboard';
export function CaptainLiveDetails({panel,data,hidden,onClose,onVault}:{panel:CaptainPanel|null;data:ReturnType<typeof useCaptainDashboard>;hidden:boolean;onClose:()=>void;onVault:(id:string)=>void}){
 const d=data.dashboard,kind=panel?.kind;
 const money=(v:string|null)=>hidden?'••••':v===null?'Unavailable':`${formatUsdc(v)} USDC`;
 const row=(label:string,value:string)=> <View style={s.row} key={label}><Text style={[s.copy,s.flex]}>{label}</Text><Text style={s.value}>{value}</Text></View>;
 const more=kind==='crew'?data.crewCursor:kind==='earnings'?data.earningsCursor:null;
 return <DashboardSheet visible={!!panel} title={kind==='crew'?'Your Crew':kind==='earnings'?'Your earnings':kind==='manage'?'Manage vaults':'Assets under management'} onClose={onClose}>
  <View style={s.content}>
   {data.loading?<Text style={s.copy}>Updating your dashboard…</Text>:null}
   {data.error?<View><Text accessibilityRole="alert" style={s.copy}>{data.error}</Text><AuthButton accessibilityRole="button" onPress={data.refresh} style={s.button}><Text style={s.value}>Retry</Text></AuthButton></View>:null}
   {d&&(kind==='overview'||kind==='manage')?<><Text style={s.big}>{kind==='manage'?`${d.vaultCount} vaults`:money(d.aumUsdc)}</Text><Text style={s.copy}>Assets currently managed in your open rounds. AUM changes include deposits, cancellations, and market movements; they are separate from investment returns.</Text>{data.vaults.map(v=><AuthButton key={v.id} accessibilityRole="button" onPress={()=>onVault(v.id)} style={s.row}><View style={s.flex}><Text style={s.value}>{v.name}</Text><Text style={s.copy}>{v.phase.toLowerCase()}</Text></View><Text style={s.value}>{money(['COMPLETED','CANCELLED'].includes(v.phase)?'0':v.navUsdc)}</Text></AuthButton>)}{data.vaultCursor?<AuthButton accessibilityRole="button" onPress={()=>{void data.loadMore('vaults');}} style={s.button}><Text style={s.value}>Load more vaults</Text></AuthButton>:null}</>:null}
   {d&&kind==='crew'?<><Text style={s.big}>{d.crewMembers} members</Text><Text style={s.copy}>Unique Crew members in open rounds. Your Captain seed is excluded.</Text>{!data.loading&&data.crew.length===0?<Text style={s.copy}>Your Crew will appear when someone joins a vault.</Text>:null}{data.crew.map(m=><View key={m.id} style={s.row}><View style={s.flex}><Text style={s.value}>{m.displayName||m.username||'Crew member'}</Text><Text style={s.copy}>{m.vaultCount} vaults · Joined {new Date(m.joinedAt).toLocaleDateString()}</Text></View><Text style={s.value}>{money(m.allocatedUsdc)}</Text></View>)}</>:null}
   {d&&kind==='earnings'?<><Text style={s.big}>{money(d.earnings.earnedUsdc)}</Text>{row('Claimable fees',money(d.earnings.claimableUsdc))}{row('Claimed fees',money(d.earnings.claimedUsdc))}<Text style={s.copy}>Captain fees are 10% of positive net round profit, calculated at final settlement. Your investment proceeds are separate.</Text>{!data.loading&&data.earnings.length===0?<Text style={s.copy}>No fees earned yet. Completed rounds will appear here.</Text>:null}{data.earnings.map(e=><AuthButton key={e.vaultId} accessibilityRole="button" onPress={()=>onVault(e.vaultId)} style={s.row}><View style={s.flex}><Text style={s.value}>{e.name}</Text><Text style={s.copy}>{e.claimedAt?'Claimed':'View settlement and claim'}</Text></View><Text style={s.value}>{money(e.earnedUsdc)}</Text></AuthButton>)}</>:null}
   {more?<AuthButton accessibilityRole="button" onPress={()=>{if(kind==='crew'||kind==='earnings')void data.loadMore(kind);}} style={s.button}><Text style={s.value}>Load more</Text></AuthButton>:null}
  </View>
 </DashboardSheet>;
}
const s=StyleSheet.create({content:{gap:14},flex:{flex:1,minWidth:0,gap:3},copy:{fontFamily:InterFont.regular,fontSize:12,lineHeight:18,color:C.secondary},value:{fontFamily:InterFont.medium,fontSize:12,lineHeight:18,color:C.ink},big:{fontFamily:BrandFont.editorial,fontSize:36,lineHeight:42,color:C.ink},row:{flexDirection:'row',gap:12,paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.line,alignItems:'center'},button:{minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:16,backgroundColor:C.tileIcon}});
