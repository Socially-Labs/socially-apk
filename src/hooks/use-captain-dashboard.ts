import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/auth/session';
import { createApiClient } from '@/api/client';
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
 useEffect(()=>{
  const request=new AbortController();controller.current=request;paging.current=false;let timer:ReturnType<typeof setTimeout>;let reading=false;
  const valid=()=>!request.signal.aborted;
  setState(s=>s.subject===subject?{...s,loading:true,error:null}:{...empty,subject});
  async function read(){
   if(!subject||reading||!valid())return;
   if(AppState.currentState==='background'||AppState.currentState==='inactive'){timer=setTimeout(()=>void read(),15000);return;}
   reading=true;
   try{
    const [dashboard,performance,vaults,extra]=await Promise.all([api.dashboard(request.signal),api.performance(range,request.signal),api.vaults(null,request.signal),
     detail==='crew'?api.crew(null,request.signal):detail==='earnings'?api.earnings(null,request.signal):null]);
    if(valid())setState(s=>({...s,subject,dashboard,performance,vaults:vaults.items,vaultCursor:vaults.nextCursor,loading:false,error:null,
     ...(detail==='crew'&&extra?{crew:extra.items as CaptainMember[],crewCursor:extra.nextCursor}:{}),
     ...(detail==='earnings'&&extra?{earnings:extra.items as CaptainEarning[],earningsCursor:extra.nextCursor}:{})}));
   }catch(e){if(valid())setState(s=>({...s,loading:false,error:e instanceof Error?e.message:'Could not load your Captain dashboard.'}));}
   finally{reading=false;if(valid())timer=setTimeout(()=>void read(),15000);}
  }
  if(subject)void read();else setState({...empty,subject,loading:!auth.isReady,error:auth.isReady?'Sign in to view your Captain dashboard.':null});
  const listener=AppState.addEventListener('change',next=>{if(next==='active'){clearTimeout(timer);void read();}});
  return()=>{request.abort();clearTimeout(timer);listener.remove();};
 },[api,subject,range,detail,revision,auth.isReady]);
 const loadMore=async(kind:'vaults'|'crew'|'earnings')=>{
  const request=controller.current;if(!request||request.signal.aborted||paging.current||state.subject!==subject)return;
  const cursor=kind==='vaults'?state.vaultCursor:kind==='crew'?state.crewCursor:state.earningsCursor;if(!cursor)return;paging.current=true;
  try{const result=await api[kind](cursor,request.signal);if(!request.signal.aborted)setState(s=>kind==='vaults'?{...s,vaults:[...s.vaults,...result.items as VaultSummary[]],vaultCursor:result.nextCursor}:kind==='crew'?{...s,crew:[...s.crew,...result.items as CaptainMember[]],crewCursor:result.nextCursor}:{...s,earnings:[...s.earnings,...result.items as CaptainEarning[]],earningsCursor:result.nextCursor});}
  catch(e){if(!request.signal.aborted)setState(s=>({...s,error:e instanceof Error?e.message:'Could not load more.'}));}
  finally{if(!request.signal.aborted)paging.current=false;}
 };
 return{...(state.subject===subject?state:empty),performance:state.subject===subject&&state.performance?.range===range?state.performance:null,refresh,loadMore};
}
