import { useEffect,useState,type ReactNode } from 'react';
import { ActivityIndicator,Pressable,StyleSheet,Text,View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight,CalendarDays,ChartNoAxesColumn,Clock3,Coins,Link,LockKeyhole,Percent,Play,ReceiptText,Users,Wallet } from 'lucide-react-native';
import type { VaultCreateInput,VaultPreview,vaultsApi } from '@/api/vaults';
import { InterFont } from '@/constants/fonts';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import { RoundTerms } from './vault-round-terms';

const money=(value:string)=>`${value.replace(/\.000000$/,'').replace(/\B(?=(\d{3})+(?!\d))/g,',')} paper USDC`;
function Card({children}:{children:ReactNode}){return <LinearGradient colors={C.gradient} style={s.card}>{children}</LinearGradient>;}
function Row({label,value,icon,note}:{label:string;value:string;icon:ReactNode;note?:string}){
 return <View style={s.row}>{icon}<View style={s.rowBody}><View style={s.rowMain}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>{note?<Text style={s.caption}>{note}</Text>:null}</View></View>;
}
export function VaultCreateReview({api,body,disabled,busy,saved,onConfirm,onEdit}:{api:ReturnType<typeof vaultsApi>;body:VaultCreateInput;disabled:boolean;busy:boolean;saved:boolean;onConfirm:()=>void;onEdit:()=>void}){
 const [preview,setPreview]=useState<VaultPreview|null>(null),[error,setError]=useState<string|null>(null),[revision,setRevision]=useState(0),[fullTerms,setFullTerms]=useState(false);
 const {name,description,fundingWindowHours,durationDays,termsVersion}=body;
 useEffect(()=>{
  const controller=new AbortController();
  void (async()=>{
   try{
    const result=await api.preview({name,description,fundingWindowHours,durationDays,termsVersion},controller.signal);
    if(!controller.signal.aborted){setPreview(result);setError(null);}
   }catch(error){if(!controller.signal.aborted){setPreview(null);setError(error instanceof Error?error.message:'Could not load your vault review.');}}
  })();
  return ()=>controller.abort();
 },[api,name,description,fundingWindowHours,durationDays,termsVersion,revision]);
 const blocked=preview?!preview.enabled?'New paper vaults are currently unavailable on this backend.':!preview.captainEligible?'Only Captains can create a vault.':BigInt(preview.availableUsdc.replace('.',''))<BigInt(preview.seedUsdc.replace('.',''))?`You need ${money(preview.seedUsdc)} available to create this vault.`:null:null;
 const icon={size:19,color:'#456487'};
 return <>
  {!preview?<Card>{error?<><Text accessibilityRole="alert" style={s.error}>{error}</Text><Pressable accessibilityRole="button" onPress={()=>{setError(null);setRevision(v=>v+1);}} style={s.edit}><Text style={s.editText}>Retry review</Text></Pressable></>:<><ActivityIndicator color={C.ink}/><Text style={s.label}>Checking your round terms and available funds…</Text></>}</Card>:<>
   <Card><Text style={s.sectionTitle}>Vault summary</Text>
    <Row label="Funding window" value={`${preview.input.fundingWindowHours} hours`} icon={<CalendarDays {...icon}/>}/>
    <Row label="Trading duration" value={`${preview.input.durationDays} days`} icon={<Clock3 {...icon}/>}/>
    <Row label="Your seed" value={money(preview.seedUsdc)} icon={<Coins {...icon}/>}/>
    <Row label="Minimum total" value={money(preview.minimumCapitalUsdc)} note="Total minimum includes your seed." icon={<Users {...icon}/>}/>
    <Row label="Maximum total" value={money(preview.maximumCapitalUsdc)} icon={<ChartNoAxesColumn {...icon}/>}/>
    <Row label="Crew minimum" value={money(preview.minimumCrewDepositUsdc)} icon={<Users {...icon}/>}/>
    <View style={s.spacer}/><Row label="Creation fee" value="0 paper USDC" icon={<ReceiptText {...icon}/>}/>
    <Row label="Network cost" value={money(preview.networkCostUsdc)} icon={<Link {...icon}/>}/>
    <View style={s.total}><Wallet size={23} color="#00846C"/><View style={{flex:1,gap:4}}><Text style={s.label}>Your total contribution</Text><Text style={s.totalValue}>{money(preview.seedUsdc)}</Text></View></View>
   </Card>
   <Card><Text style={s.sectionTitle}>Rules</Text><View style={s.rule}><Percent {...icon}/><Text style={s.ruleText}>10% of positive total net round profit at final settlement.</Text></View><View style={s.rule}><LockKeyhole {...icon}/><Text style={s.ruleText}>Funds stay locked during trading.</Text></View><View style={s.rule}><Play {...icon}/><Text style={s.ruleText}>Trading starts after funding closes if the minimum is met.</Text></View><Text style={s.caption}>Artwork uploads after creation. Paper funds have no redemption value.</Text>
    <Pressable accessibilityRole="button" accessibilityState={{expanded:fullTerms}} onPress={()=>setFullTerms(v=>!v)} style={s.termsButton}><Text style={s.editText}>{fullTerms?'Hide full round terms':'Full round terms'}</Text></Pressable>{fullTerms?<RoundTerms/>:null}
   </Card>
   {blocked?<Card><Text accessibilityRole="alert" style={s.error}>{blocked}</Text></Card>:null}
  </>}
  <Pressable accessibilityRole="button" accessibilityState={{disabled:disabled||!preview||!!blocked||busy}} disabled={disabled||!preview||!!blocked||busy} onPress={onConfirm} style={({pressed})=>[s.confirm,(disabled||!preview||!!blocked||busy||pressed)&&{opacity:0.5}]}><Text style={s.confirmText}>{busy?'Confirming…':saved?'Retry saved creation':preview?`Invest ${money(preview.seedUsdc)} & create`:'Checking terms…'}</Text><ArrowRight size={21} color="white"/></Pressable>
  {!saved?<Pressable accessibilityRole="button" disabled={busy} onPress={onEdit} style={s.edit}><Text style={s.editText}>Edit vault</Text></Pressable>:null}
 </>;
}
const s=StyleSheet.create({
 card:{padding:18,borderRadius:24,borderWidth:1,borderColor:C.border,gap:12,boxShadow:'0 8px 24px rgba(64,99,142,0.06)'},sectionTitle:{fontFamily:InterFont.medium,color:'#587395',fontSize:15},row:{flexDirection:'row',alignItems:'flex-start',gap:12},rowBody:{flex:1,gap:4,borderBottomWidth:1,borderBottomColor:'#DCE8F7',paddingBottom:10},rowMain:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',gap:6},label:{fontFamily:InterFont.regular,fontSize:13,lineHeight:19,color:'#587395',flexShrink:1},value:{fontFamily:InterFont.medium,fontSize:13,lineHeight:19,color:'#102543'},caption:{fontFamily:InterFont.regular,fontSize:11,lineHeight:17,color:'#587395'},spacer:{height:2},total:{backgroundColor:'#E4FBF3',borderWidth:1,borderColor:'#BEECE2',borderRadius:18,padding:14,flexDirection:'row',alignItems:'center',gap:12},totalValue:{fontFamily:InterFont.semiBold,fontSize:19,color:'#102543'},rule:{flexDirection:'row',alignItems:'flex-start',gap:12},ruleText:{flex:1,fontFamily:InterFont.regular,fontSize:12,lineHeight:19,color:'#587395'},confirm:{minHeight:54,borderRadius:28,backgroundColor:'#244F7B',paddingHorizontal:18,paddingVertical:14,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:12},confirmText:{fontFamily:InterFont.semiBold,fontSize:14,color:'white',flexShrink:1},edit:{minHeight:44,alignItems:'center',justifyContent:'center'},termsButton:{minHeight:44,justifyContent:'center'},editText:{fontFamily:InterFont.medium,fontSize:13,color:'#24649E'},error:{fontFamily:InterFont.regular,fontSize:13,lineHeight:20,color:C.negative},
});
