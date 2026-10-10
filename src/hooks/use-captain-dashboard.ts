import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/auth/session';
import { useFocusEffect } from 'expo-router';
import { subscribeCaptainChanges } from '@/api/captain-stream';
import { createApiClient,apiOrigin } from '@/api/client';
import { captainDashboardApi,type CaptainDashboard,type CaptainPerformance,type CaptainRange,type CaptainMember,type CaptainEarning } from '@/api/captain-dashboard';
import type { VaultSummary } from '@/api/vaults';
type State={subject:string|null;dashboard:CaptainDashboard|null;performance:CaptainPerformance|null;vaults:VaultSummary[];crew:CaptainMember[];earnings:CaptainEarning[];
 vaultCursor:string|null;crewCursor:string|null;earningsCursor:string|null;loading:boolean;error:string|null};
const empty:State={subject:null,dashboard:null,performance:null,vaults:[],crew:[],earnings:[],vaultCursor:null,crewCursor:null,earningsCursor:null,loading:true,error:null};
export function useCaptainDashboard(range:CaptainRange,panel:string|null){
 const auth=useAuth(),subject=auth.isReady&&auth.isAuthenticated?auth.accountId:null;
 const getter=useRef(auth.getAccessToken);useEffect(()=>{getter.current=auth.getAccessToken;},[auth.getAccessToken]);
 const api=useMemo(()=>captainDashboardApi(createApiClient({origin:process.env.EXPO_PUBLIC_API_URL,getAccessToken:()=>getter.current()})),[]);
 const [state,setState]=useState<State>(empty),[revision,setRevision]=useState(0);
 const controller=useRef<AbortController|null>(null),paging=useRef(false);
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 const detail=panel==='crew'?'crew':panel==='earnings'?'earnings':null;
 useFocusEffect(useCallback(()=>{
  void revision;
  const request=new AbortController();controller.current=request;paging.current=false;let timer:ReturnType<typeof setTimeout>;let reading=false,dirty=false,connected=false;let stopStream:(()=>void)|undefined;let activeRead:AbortController|undefined;
  const valid=()=>!request.signal.aborted;
  setState(s=>s.subject===subject?{...s,loading:true,error:null}:{...empty,subject});
  const schedule=(delay:number)=>{clearTimeout(timer);if(valid())timer=setTimeout(()=>void read(),delay);};
  const invalidate=()=>{if(!valid())return;if(reading){dirty=true;return;}schedule(250);};
  const startStream=()=>{if(stopStream||!subject||process.env.EXPO_PUBLIC_PAPER_PRIVATE_UPDATES_ENABLED!=='true')return;
   stopStream=subscribeCaptainChanges({origin:apiOrigin(process.env.EXPO_PUBLIC_API_URL),getAccessToken:()=>getter.current(),onRevision:invalidate,onConnection:ready=>{connected=ready;}});
  };
  async function read(){
   if(!subject||reading||!valid())return;
   if(AppState.currentState==='background'||AppState.currentState==='inactive'){return;}
   reading=true;const readRequest=new AbortController();activeRead=readRequest;
   try{
    const [dashboard,performance,vaults,extra]=await Promise.all([api.dashboard(readRequest.signal),api.performance(range,readRequest.signal),api.vaults(null,readRequest.signal),
     detail==='crew'?api.crew(null,readRequest.signal):detail==='earnings'?api.earnings(null,readRequest.signal):null]);
    if(valid()&&!readRequest.signal.aborted)setState(s=>({...s,subject,dashboard,performance,vaults:vaults.items,vaultCursor:vaults.nextCursor,loading:false,error:null,
     ...(detail==='crew'&&extra?{crew:extra.items as CaptainMember[],crewCursor:extra.nextCursor}:{}),
     ...(detail==='earnings'&&extra?{earnings:extra.items as CaptainEarning[],earningsCursor:extra.nextCursor}:{})}));
   }catch(e){if(valid()&&!readRequest.signal.aborted)setState(s=>({...s,loading:false,error:e instanceof Error?e.message:'Could not load your Captain dashboard.'}));}
   finally{reading=false;activeRead=undefined;if(valid()&&(!AppState.currentState||AppState.currentState==='active')){const delay=dirty?250:connected?60000:15000+Math.random()*5000;dirty=false;schedule(delay);}}
  }
  if(subject){void read();if(!AppState.currentState||AppState.currentState==='active')startStream();}else setState({...empty,subject,loading:!auth.isReady,error:auth.isReady?'Sign in to view your Captain dashboard.':null});
  const listener=AppState.addEventListener('change',next=>{if(next==='active'){startStream();invalidate();}else{activeRead?.abort();stopStream?.();stopStream=undefined;clearTimeout(timer);}});
  return()=>{request.abort();activeRead?.abort();clearTimeout(timer);stopStream?.();listener.remove();};
 },[api,subject,range,detail,revision,auth.isReady]));
 const loadMore=async(kind:'vaults'|'crew'|'earnings')=>{
  const request=controller.current;if(!request||request.signal.aborted||paging.current||state.subject!==subject)return;
  const cursor=kind==='vaults'?state.vaultCursor:kind==='crew'?state.crewCursor:state.earningsCursor;if(!cursor)return;paging.current=true;
  try{const result=await api[kind](cursor,request.signal);if(!request.signal.aborted)setState(s=>kind==='vaults'?{...s,vaults:[...s.vaults,...result.items as VaultSummary[]],vaultCursor:result.nextCursor}:kind==='crew'?{...s,crew:[...s.crew,...result.items as CaptainMember[]],crewCursor:result.nextCursor}:{...s,earnings:[...s.earnings,...result.items as CaptainEarning[]],earningsCursor:result.nextCursor});}
  catch(e){if(!request.signal.aborted)setState(s=>({...s,error:e instanceof Error?e.message:'Could not load more.'}));}
  finally{if(!request.signal.aborted)paging.current=false;}
 };
 return{...(state.subject===subject?state:empty),performance:state.subject===subject&&state.performance?.range===range?state.performance:null,refresh,loadMore};
}
