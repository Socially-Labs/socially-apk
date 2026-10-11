import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { KeyboardScrollView } from '@/components/shared/keyboard/keyboard-scroll-view';
import { PaperBalanceSetup } from './paper-balance-setup';
import { useEffect,useRef,useState,type ReactNode } from 'react';
import { Image,Keyboard,KeyboardAvoidingView,Platform,Pressable,ScrollView,StyleSheet,Text,TextInput,View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft,ArrowRight,CalendarDays,Camera,ChevronDown,Clock3,ImagePlus,LockKeyhole } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVaults } from '@/hooks/use-vaults';
import { useVaultIntent } from '@/hooks/use-vault-intent';
import { pickProfileMedia } from '@/components/settings/profile-media';
import { readProfileUpload,uploadFetch } from '@/components/settings/profile-upload';
import { BrandFont,InterFont } from '@/constants/fonts';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import { VaultCreateReview } from './vault-create-review';
const harbor=require('../../../assets/images/home/crew-harbor.webp');
type Artwork='avatar'|'banner';
function Button({children,onPress,disabled=false,secondary=false}:{children:ReactNode;onPress:()=>void;disabled?:boolean;secondary?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,secondary&&s.secondary,(disabled||pressed)&&{opacity:0.5}]}><Text style={[s.buttonText,secondary&&{color:C.ink}]}>{children}</Text>{!secondary?<ArrowRight size={21} color="white"/>:null}</Pressable>;
}
function Glass({children,style}:{children:ReactNode;style?:object}){return <LinearGradient colors={C.gradient} style={[s.glass,style]}>{children}</LinearGradient>;}
function Choice({label,value,options,onChange,disabled,icon}:{label:string;value:number;options:number[];onChange:(v:number)=>void;disabled:boolean;icon:ReactNode}){
 const [open,setOpen]=useState(false);const unit=label==='Funding window'?'hours':'days';
 return <Glass style={{flex:1,padding:14}}>{icon}<Text style={s.label}>{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${value} ${unit}`} accessibilityState={{disabled,expanded:open}} disabled={disabled} onPress={()=>setOpen(!open)} style={s.picker}><Text style={s.setting}>{value} {unit}</Text><ChevronDown color={C.ink} size={18}/></Pressable>
 {open?<View style={{gap:4}}>{options.map(option=><Pressable key={option} accessibilityRole="radio" accessibilityLabel={`${option} ${unit}`} accessibilityState={{checked:option===value}} onPress={()=>{onChange(option);setOpen(false);}} style={[s.option,option===value&&{backgroundColor:'#D8F8EE'}]}><Text style={s.copy}>{option} {unit}</Text></Pressable>)}</View>:null}</Glass>;
}
export function VaultCreateScreen(){const data=useVaults();return <CreateForm key={data.subject??'signed-out'} data={data}/>;}
function CreateForm({data}:{data:ReturnType<typeof useVaults>}){
 const insets=useSafeAreaInsets();
 const descriptionInput=useRef<TextInput>(null);
 const [portfolioReady,setPortfolioReady]=useState(false);
 const [name,setName]=useState(''),[description,setDescription]=useState(''),[hours,setHours]=useState(24),[days,setDays]=useState(14),[review,setReview]=useState(false);
 const [art,setArt]=useState<Record<Artwork,string|null>>({avatar:null,banner:null});
 const [picking,setPicking]=useState(false),[mediaError,setMediaError]=useState<string|null>(null),[createdId,setCreatedId]=useState<string|null>(null),[uploading,setUploading]=useState(false),[uploadRevision,setUploadRevision]=useState(0);
 const mounted=useRef(true),pickLock=useRef(false),done=useRef(new Set<Artwork>()),scroll=useRef<ScrollView>(null);
 useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
 const intent=useVaultIntent(data.api,data.subject,'create',id=>{setUploading(true);setMediaError(null);setCreatedId(id);});
 const saved=intent.attempt?.intent.kind==='CREATE'?intent.attempt.intent.body:null;
 const body=saved??{name:name.trim(),description:description.trim(),fundingWindowHours:hours,durationDays:days,termsVersion:1 as const};
 const config=data.config,locked=!!saved||intent.busy||!!createdId||picking;
 const openVault=(id:string)=>router.replace({pathname:'/vaults/[id]',params:{id}});
 useEffect(()=>{
  if(!createdId)return;
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90_000);let active=true;
  void (async()=>{
   try{
    for(const kind of ['banner','avatar'] as const){
     const uri=art[kind];if(!uri||done.current.has(kind))continue;
     const file=await readProfileUpload(uri,controller.signal);
     await data.api.uploadImage(createdId,kind,file,uploadFetch,controller.signal);
     if(controller.signal.aborted)return;done.current.add(kind);
    }
    if(active&&!controller.signal.aborted)router.replace({pathname:'/vaults/[id]',params:{id:createdId}});
   }catch(error){if(active)setMediaError(controller.signal.aborted?'Artwork upload timed out. Your vault was created. Retry the artwork or open your vault.':`Your vault was created. ${error instanceof Error?error.message:'Artwork could not be saved.'}`);}
   finally{clearTimeout(timer);if(active)setUploading(false);}
  })();
  return ()=>{active=false;clearTimeout(timer);controller.abort();};
 },[createdId,art,data.api,uploadRevision]);
 async function choose(kind:Artwork){
  if(locked||pickLock.current)return;Keyboard.dismiss();pickLock.current=true;setPicking(true);setMediaError(null);
  try{const uri=await pickProfileMedia(kind==='avatar'?'photo':'banner');if(uri&&mounted.current)setArt(old=>({...old,[kind]:uri}));}
  catch(error){if(mounted.current)setMediaError(error instanceof Error?error.message:'Could not select artwork.');}
  finally{pickLock.current=false;if(mounted.current)setPicking(false);}
 }
 const valid=(!config?.walletSnapshotEnabled||portfolioReady)&&!!config?.enabled&&!data.error&&!!data.subject&&intent.ready&&!locked&&body.name.length>=3&&config.fundingWindowHours.includes(hours)&&config.durationDays.includes(days);
 const reviewing=review||!!saved;
 useEffect(()=>{scroll.current?.scrollTo({y:0,animated:false});},[reviewing,createdId]);
 return <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={s.root}>
  <Image source={harbor} style={s.background} resizeMode="cover" accessibilityIgnoresInvertColors/>
  <LinearGradient colors={['rgba(245,250,255,0.06)','rgba(241,248,255,0.88)','#F5F7FB']} locations={[0,0.4,0.8]} style={StyleSheet.absoluteFill} pointerEvents="none"/>
  <KeyboardScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[s.content,{paddingTop:insets.top+14,paddingBottom:insets.bottom+24}]}>
   <Pressable accessibilityRole="button" accessibilityLabel={createdId?'Open created vault':reviewing&&!saved?'Back to vault details':'Back'} disabled={intent.busy||uploading} onPress={()=>createdId?openVault(createdId):reviewing&&!saved?setReview(false):router.canGoBack()?router.back():router.replace('/')} style={s.back}><ArrowLeft size={24} color={C.ink}/></Pressable>
   <Text accessibilityRole="header" style={[s.title,reviewing&&{fontSize:36,lineHeight:40}]}>{createdId?'Vault created':reviewing?'Review your vault':'Create a vault'}</Text>
   <View style={s.badge}><Text style={s.badgeText}>Paper vault</Text></View>
   {data.loading&&!config?<ShipLoader label="Loading vault configuration…"/>:null}
   {(data.error||intent.error||mediaError)?<Glass><Text accessibilityRole="alert" style={s.error}>{mediaError??intent.error??data.error}</Text>{data.error&&!createdId?<Button secondary onPress={data.refresh}>Retry loading</Button>:null}</Glass>:null}
   {!data.loading&&config&&!config.enabled&&!createdId?<Glass><Text style={s.copy}>Paper vault creation is currently disabled. Your details are kept; retry when the service is available.</Text></Glass>:null}
   {!data.subject?<Text style={s.copy}>Sign in as a Captain to create your vault.</Text>:null}
   {createdId?<Glass><Text style={s.cardTitle}>{body.name}</Text><Text style={s.copy}>{uploading?'Saving your vault artwork…':'Your vault is confirmed. Artwork can also be updated from the vault page.'}</Text>{uploading?<ShipLoader label="Saving your vault artwork…" showLabel={false}/>:<><Button onPress={()=>{setUploading(true);setMediaError(null);setUploadRevision(v=>v+1);}}>Retry artwork</Button><Button secondary onPress={()=>openVault(createdId)}>Open vault</Button></>}</Glass>:<>
    <View>
     <Glass style={s.cover}>
      {art.banner?<Image source={{uri:art.banner}} style={s.imageFill} resizeMode="cover" accessibilityLabel="Selected vault banner"/>:<Image source={harbor} style={[s.imageFill,{opacity:0.58}]} resizeMode="cover"/>}
      <View style={s.coverHeader}><Text style={s.coverLabel}>Vault banner</Text><Pressable accessibilityRole="button" accessibilityLabel={art.banner?'Change vault banner':'Add vault banner'} disabled={locked} onPress={()=>{void choose('banner');}} style={s.smallButton}><ImagePlus size={17} color={C.ink}/><Text style={s.smallText}>{art.banner?'Change':'Add banner'}</Text></Pressable></View>
     </Glass>
     <View style={s.artRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={art.avatar?'Change vault image':'Add vault image'} disabled={locked} onPress={()=>{void choose('avatar');}} style={s.avatar}>{art.avatar?<Image source={{uri:art.avatar}} style={s.imageFill} accessibilityLabel="Selected vault image"/>:<Camera size={32} color="#456487"/>}</Pressable>
      {reviewing?<View style={{flex:1,gap:6,paddingTop:22}}><Text style={s.cardTitle}>{body.name}</Text><Text style={s.caption}>{body.description||'No strategy description'}</Text></View>:<><View style={{flex:1,gap:6,paddingTop:24}}><Text style={s.label}>Vault image</Text><Pressable accessibilityRole="button" accessibilityLabel={art.avatar?'Replace vault image':'Choose vault image'} disabled={locked} onPress={()=>{void choose('avatar');}} style={s.smallButton}><ImagePlus size={16} color={C.ink}/><Text style={s.smallText}>{art.avatar?'Change image':'Add image'}</Text></Pressable></View><Text style={[s.caption,{flex:0.9,paddingTop:24}]}>Optional artwork uploads after creation.</Text></>}
     </View>
    </View>
    {config?.walletSnapshotEnabled&&!reviewing?<PaperBalanceSetup onReady={()=>{setPortfolioReady(true);}}/>:null}
    {!reviewing?<>
     <Glass><Text style={s.label}>Vault name</Text><TextInput accessibilityLabel="Vault name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={()=>descriptionInput.current?.focus()} placeholder="e.g. Horizon Growth" placeholderTextColor="#8194AC" value={name} onChangeText={setName} maxLength={80} editable={!locked} style={s.input}/><Text style={s.label}>Strategy description</Text><TextInput ref={descriptionInput} accessibilityLabel="Strategy description" placeholder="Describe your approach to the markets" placeholderTextColor="#8194AC" value={description} onChangeText={setDescription} maxLength={1000} multiline editable={!locked} style={[s.input,s.multiline]}/></Glass>
     <View style={s.settings}><Choice label="Funding window" value={hours} options={config?.fundingWindowHours??[]} onChange={setHours} disabled={locked||!config} icon={<Clock3 size={24} color="#456487"/>}/><Choice label="Trading duration" value={days} options={config?.durationDays??[]} onChange={setDays} disabled={locked||!config} icon={<CalendarDays size={24} color="#456487"/>}/></View>
     <View style={s.seed}><View style={s.seedRow}><View style={s.lock}><LockKeyhole size={23} color="#00846C"/></View><View style={{flex:1}}><Text style={s.label}>Your seed</Text><Text style={s.seedValue}>{config?`${config.captainSeedUsdc.replace(/\.0+$/,'')} paper USDC`:'Loading…'}</Text></View></View><View style={s.rule}/><Text style={s.caption}>10% fee on positive net round profit</Text><Text style={s.caption}>Capital stays locked during trading</Text></View>
     <Button disabled={!valid} onPress={()=>{Keyboard.dismiss();setReview(true);}}>{picking?'Preparing artwork…':'Review terms'}</Button>
    </>:<VaultCreateReview key={JSON.stringify(body)} api={data.api} body={body} disabled={!config?.enabled||!!data.error||!intent.ready||picking} busy={intent.busy} saved={!!saved} onConfirm={()=>{void intent.submit({kind:'CREATE',body});}} onEdit={()=>setReview(false)}/>}
    <Text style={[s.caption,{textAlign:'center'}]}>Paper funds only · No real money is used</Text>
   </>}
  </KeyboardScrollView>
 </KeyboardAvoidingView>;
}
const s=StyleSheet.create({
 root:{flex:1,backgroundColor:'#F5F7FB'},background:{position:'absolute',top:0,left:0,width:'100%',height:440},imageFill:{position:'absolute',top:0,left:0,width:'100%',height:'100%'},content:{paddingHorizontal:16,gap:14,width:'100%',maxWidth:560,alignSelf:'center'},
 back:{width:44,height:44,borderRadius:22,backgroundColor:'rgba(255,255,255,0.7)',borderWidth:1,borderColor:'white',alignItems:'center',justifyContent:'center',marginBottom:8},title:{fontFamily:BrandFont.editorial,fontSize:43,lineHeight:47,color:'#102543',letterSpacing:-0.8},badge:{backgroundColor:'#E6FCF4',borderRadius:20,paddingHorizontal:13,paddingVertical:6,alignSelf:'flex-start',marginTop:-7},badgeText:{color:'#176077',fontFamily:InterFont.medium,fontSize:13},
 glass:{borderRadius:24,borderWidth:1,borderColor:C.border,padding:18,gap:12,boxShadow:'0 8px 24px rgba(64,99,142,0.06)'},cover:{height:122,padding:12,overflow:'hidden'},coverHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8},coverLabel:{fontFamily:InterFont.semiBold,fontSize:13,color:'#18344F',backgroundColor:'rgba(255,255,255,0.74)',borderRadius:10,padding:6},smallButton:{flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'white',backgroundColor:'rgba(248,252,255,0.88)',paddingHorizontal:10,minHeight:36,borderRadius:18,alignSelf:'flex-start'},smallText:{fontFamily:InterFont.medium,fontSize:12,color:C.ink},
 artRow:{flexDirection:'row',gap:12,alignItems:'center',paddingHorizontal:8,marginTop:-25},avatar:{height:82,width:82,borderRadius:24,overflow:'hidden',backgroundColor:'#E3F0FC',borderWidth:2,borderColor:'white',alignItems:'center',justifyContent:'center',boxShadow:'0 5px 16px rgba(40,75,120,0.12)'},label:{fontFamily:InterFont.medium,fontSize:13,lineHeight:18,color:'#587395'},copy:{fontFamily:InterFont.regular,fontSize:13,lineHeight:20,color:C.ink},caption:{fontFamily:InterFont.regular,fontSize:11,lineHeight:17,color:'#587395'},
 input:{backgroundColor:'rgba(255,255,255,0.65)',borderRadius:16,borderWidth:1,borderColor:'#D8E5F6',paddingHorizontal:14,paddingVertical:12,fontFamily:InterFont.medium,fontSize:15,color:C.ink,minHeight:48},multiline:{minHeight:82,textAlignVertical:'top',fontFamily:InterFont.regular,lineHeight:21},settings:{flexDirection:'row',gap:10,alignItems:'flex-start'},picker:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6,borderWidth:1,borderColor:'#D8E5F6',borderRadius:14,padding:10,backgroundColor:'rgba(255,255,255,0.6)'},setting:{fontFamily:InterFont.semiBold,fontSize:14,color:C.ink},option:{minHeight:44,justifyContent:'center',padding:8,borderRadius:10},seed:{borderRadius:22,borderWidth:1,borderColor:'#BEECE2',backgroundColor:'rgba(231,253,244,0.9)',padding:16,gap:3},seedRow:{flexDirection:'row',alignItems:'center',gap:12},lock:{width:44,height:44,borderRadius:22,backgroundColor:'#D4F6EC',alignItems:'center',justifyContent:'center'},seedValue:{fontFamily:InterFont.semiBold,fontSize:20,color:'#102543',flexShrink:1},rule:{height:1,backgroundColor:'#CDE7E6',marginVertical:8},
 button:{minHeight:52,borderRadius:28,paddingHorizontal:20,paddingVertical:14,backgroundColor:'#193550',flexDirection:'row',gap:10,justifyContent:'center',alignItems:'center'},buttonText:{fontFamily:InterFont.semiBold,fontSize:14,color:'white',flexShrink:1},secondary:{backgroundColor:'rgba(255,255,255,0.7)',borderWidth:1,borderColor:'#D8E5F6'},cardTitle:{fontFamily:InterFont.semiBold,fontSize:20,color:C.ink},error:{fontFamily:InterFont.regular,fontSize:13,lineHeight:20,color:C.negative},
});
