import { useEffect,useMemo,useRef,useState } from 'react';
import { ActivityIndicator,Pressable,StyleSheet,Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/auth/session';
import { createApiClient } from '@/api/client';
import { paperPortfolioApi,type PaperPortfolio } from '@/api/paper-portfolio';
import { formatBalance } from '@/components/wallet/format-balance';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import { InterFont } from '@/constants/fonts';
import { useAccountSettings } from '@/components/settings/settings-provider';
export function PaperPortfolioCard({onReady}:{onReady:()=>void}){
 const auth=useAuth();return <Portfolio key={auth.accountId??'signed-out'} onReady={onReady}/>;
}
function Portfolio({onReady}:{onReady:()=>void}){
 const auth=useAuth(),{settings,ready}=useAccountSettings(),notify=useRef(onReady);
 useEffect(()=>{notify.current=onReady;},[onReady]);
 const api=useMemo(()=>paperPortfolioApi(createApiClient({origin:process.env.EXPO_PUBLIC_API_URL,getAccessToken:auth.getAccessToken,timeoutMs:30000})),[auth.getAccessToken]);
 const [portfolio,setPortfolio]=useState<PaperPortfolio|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0);
 const controller=useRef<AbortController|null>(null),locked=useRef(false);
 useEffect(()=>{const c=new AbortController();controller.current=c;void api.read(c.signal).then(p=>{if(!c.signal.aborted){setPortfolio(p);setError(null);if(p.initialized)notify.current();}},e=>{if(!c.signal.aborted)setError(e instanceof Error?e.message:'Could not load your paper balance.');});return()=>c.abort();},[api,revision]);
 async function initialize(){
  const c=controller.current;if(!auth.solanaAddress||locked.current||!c||c.signal.aborted)return;locked.current=true;setBusy(true);setError(null);
  try{const p=await api.initialize(auth.solanaAddress,c.signal);if(!c.signal.aborted){setPortfolio(p);setError(null);if(p.initialized)notify.current();}}
  catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'Could not initialize paper funds.');}
  finally{locked.current=false;if(!c.signal.aborted)setBusy(false);}
 }
 return <LinearGradient colors={C.gradient} style={s.card} testID="paper-portfolio-card"><Text style={s.title}>{portfolio?.initialized?'Your paper portfolio':'Start your paper portfolio'}</Text>
  <Text style={s.copy}>{portfolio?.initialized?`Available: ${!ready||settings.hideBalances?'••••':formatBalance(portfolio.availableUsdc)} paper USDC`:'We will read your devnet SOL and USDC balances and use their current market value as your starting paper funds.'}</Text>
  <Text style={s.copy}>Your tokens stay in your wallet. This is a one-time snapshot, not a deposit. Paper profits cannot be sent or redeemed.</Text>
  {error?<Text accessibilityRole="alert" style={s.error}>{error}</Text>:null}
  {!portfolio&&!error?<ActivityIndicator color={C.ink}/>:null}
  {portfolio&&!portfolio.initialized?<Pressable accessibilityRole="button" disabled={busy||!portfolio.enabled||!auth.solanaAddress} accessibilityState={{disabled:busy||!portfolio.enabled||!auth.solanaAddress}} onPress={()=>void initialize()} style={[s.button,(busy||!portfolio.enabled||!auth.solanaAddress)&&s.dim]}><Text style={s.buttonText}>{busy?'Reading wallet and prices…':'Initialize paper funds'}</Text></Pressable>:null}
  {!portfolio&&error?<Pressable accessibilityRole="button" onPress={()=>{setError(null);setRevision(v=>v+1);}} style={s.button}><Text style={s.buttonText}>Retry paper balance</Text></Pressable>:null}
  {!portfolio?.initialized&&!auth.solanaAddress?<Text style={s.copy}>Connect your Solana wallet to initialize paper funds.</Text>:null}
 </LinearGradient>;
}
const s=StyleSheet.create({card:{padding:18,borderRadius:24,borderWidth:1,borderColor:C.border,gap:12},title:{fontFamily:InterFont.semiBold,fontSize:17,color:C.ink},copy:{fontFamily:InterFont.regular,fontSize:12,lineHeight:19,color:'#587395'},error:{fontFamily:InterFont.regular,fontSize:13,lineHeight:20,color:C.negative},button:{minHeight:48,borderRadius:24,backgroundColor:'#244F7B',padding:12,alignItems:'center',justifyContent:'center'},buttonText:{fontFamily:InterFont.semiBold,fontSize:13,color:'white'},dim:{opacity:0.5}});
