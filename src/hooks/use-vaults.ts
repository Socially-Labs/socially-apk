import { getApiOrigin } from '@/api/runtime-origin';
import { useCallback,useEffect,useMemo,useRef,useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { apiOrigin,createApiClient } from '@/api/client';
import { vaultsApi,type VaultConfig,type VaultPosition,type VaultSummary } from '@/api/vaults';
import { useAuth } from '@/auth/session';
export function useVaults(id?:string,mine=false,durationGroup:'all'|'short'|'long'='all') {
 const { accountId,isAuthenticated,getAccessToken }=useAuth();
 const subject=isAuthenticated?accountId:null;
 const getter=useRef(getAccessToken); useEffect(()=>{ getter.current=getAccessToken; },[getAccessToken]);
 const api=useMemo(()=>vaultsApi(createApiClient({ origin:getApiOrigin(),getAccessToken:()=>getter.current() })),[]);
 const [revision,setRevision]=useState(0);
 const [state,setState]=useState<{ scope:string; config:VaultConfig|null; vaults:VaultSummary[]; vault:VaultSummary|null; position:VaultPosition|null;
  configLoading:boolean; configError:string|null; status:'loading'|'success'|'error'; loading:boolean; paging:boolean; error:string|null; privateError:string|null; connected:boolean; refreshedAt:number|null; nextCursor:string|null }>(
  { scope:'',config:null,configLoading:true,configError:null,vaults:[],vault:null,position:null,status:'loading',loading:true,paging:false,error:null,privateError:null,connected:false,refreshedAt:null,nextCursor:null });
 const scope=`${subject}:${id ?? ''}:${mine}:${durationGroup}`,epoch=useRef(0),cursor=useRef<string|null>(null),loadingMore=useRef(false);
 const pageRequest=useRef<AbortController|null>(null);
 const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 useFocusEffect(useCallback(()=>{
  void revision;pageRequest.current?.abort();loadingMore.current=false;
  const generation=++epoch.current,controller=new AbortController();
  let stopped=false,busy=false,dirty=false,socket:WebSocket|null=null,retry:ReturnType<typeof setTimeout>|undefined,backoff=1000,lastRefresh=0;
  let watched:string[]=[],sequence=new Map<string,string>();
  const valid=()=>!stopped && epoch.current===generation && !controller.signal.aborted;
  const foreground=()=>!AppState.currentState || AppState.currentState==='active';
  setState(s=>s.scope===scope?{ ...s,status:s.status==='success'?'success':'loading',loading:true,configLoading:true,paging:false,error:null }:{ scope,config:null,configLoading:true,configError:null,vaults:[],vault:null,position:null,status:'loading',loading:true,paging:false,error:null,privateError:null,connected:false,refreshedAt:null,nextCursor:null });
  cursor.current=null;
  const subscribe=()=>{ if (socket?.readyState===WebSocket.OPEN) socket.send(JSON.stringify({ type:'subscribe',vaultIds:watched })); };
  const read=async()=>{
   if (!valid() || !foreground()) return;
   if (busy) { dirty=true; return; }
   busy=true; dirty=false;
   // Configuration controls creation; it must not block browsing confirmed vaults.
   const configRead=api.config(controller.signal).then(config=>{if(valid())setState(s=>({...s,config,configLoading:false,configError:null}));})
    .catch(error=>{if(valid())setState(s=>({...s,configLoading:false,configError:error instanceof Error?error.message:'Could not load vault configuration.'}));});
   try {
    const data=await (id?api.detail(id,controller.signal):api.list(mine,undefined,controller.signal,durationGroup));
    if (!valid()) return;
    const vault=id?data as VaultSummary:null,list=id?[]:(data as { vaults:VaultSummary[] }).vaults;
    const next=id?null:(data as { nextCursor:string|null }).nextCursor;
    const ids=id?[id]:list.map(v=>v.id).slice(0,20);
    if (JSON.stringify(ids)!==JSON.stringify(watched)) { watched=ids; subscribe(); }
    lastRefresh=Date.now(); cursor.current=next;
    setState(s=>({ ...s,vault,vaults:list,status:'success',loading:false,error:null,refreshedAt:lastRefresh,nextCursor:next }));
    if (subject && id) {
     try { const position=await api.position(id,controller.signal); if (valid()) setState(s=>({ ...s,position,privateError:null })); }
     catch (error) { if (valid()) setState(s=>({ ...s,privateError:error instanceof Error?error.message:'Could not refresh your position.' })); }
    }
   } catch (error) { if (valid()) setState(s=>({ ...s,status:'error',loading:false,error:error instanceof Error?error.message:'Could not load vaults.' })); }
   finally { await configRead; busy=false; if (dirty && valid()) { dirty=false; void read(); } }
  };
  const connect=()=>{
   if (!valid() || !foreground()) return;
   try {
    socket=new WebSocket(`${apiOrigin(getApiOrigin()).replace(/^http/,'ws')}/v1/vaults/ws`);
    const own=socket;
    own.onopen=()=>{ if (!valid() || own!==socket) { own.close(); return; } backoff=1000; setState(s=>({ ...s,connected:true })); subscribe(); void read(); };
    own.onmessage=event=>{
     if (!valid() || own!==socket) return;
     try { const value=JSON.parse(String(event.data));
      if (!value || !['resync','vault.updated'].includes(value.type) || !watched.includes(value.vaultId) || typeof value.eventSequence!=='string' || !/^\d{1,19}$/.test(value.eventSequence)) return;
      if (value.type==='resync' || sequence.get(value.vaultId)!==value.eventSequence) { sequence.set(value.vaultId,value.eventSequence); void read(); }
     } catch { /* Malformed push messages never update financial state. */ }
    };
    own.onerror=()=>own.close();
    own.onclose=()=>{ if (!valid() || own!==socket) return; setState(s=>({ ...s,connected:false }));
     retry=setTimeout(connect,backoff+Math.random()*500); backoff=Math.min(backoff*2,30000); };
   } catch { retry=setTimeout(connect,backoff); backoff=Math.min(backoff*2,30000); }
  };
  void read(); connect();
  const timer=setInterval(()=>{ if (Date.now()-lastRefresh>(socket?.readyState===WebSocket.OPEN?60000:15000)) void read(); },5000);
  const appState=AppState.addEventListener('change',status=>{
   if (retry) clearTimeout(retry);
   if (status==='active') { void read(); if (!socket || socket.readyState>1) connect(); }
   else { const old=socket; socket=null; old?.close(); if (valid()) setState(s=>({ ...s,connected:false })); }
  });
  return ()=>{ stopped=true; epoch.current++; controller.abort(); pageRequest.current?.abort();loadingMore.current=false; clearInterval(timer); if (retry) clearTimeout(retry); appState.remove(); socket?.close(); };
 },[api,scope,id,mine,subject,revision,durationGroup]));
 const loadMore=async()=>{
  if (id || state.scope!==scope || state.loading || !cursor.current || loadingMore.current) return;
  const generation=epoch.current,controller=new AbortController();pageRequest.current=controller;loadingMore.current=true;setState(s=>({...s,paging:true,error:null}));
  try { const result=await api.list(mine,cursor.current,controller.signal,durationGroup); if (epoch.current===generation) { cursor.current=result.nextCursor; setState(s=>({ ...s,vaults:[...s.vaults,...result.vaults.filter(v=>!s.vaults.some(old=>old.id===v.id))],nextCursor:result.nextCursor })); } }
  catch (error) { if (epoch.current===generation) setState(s=>({ ...s,error:error instanceof Error?error.message:'Could not load more vaults.' })); }
  finally { if(epoch.current===generation){loadingMore.current=false;setState(s=>({...s,paging:false}));} }
 };
 // Prevent even one render of another account's private position.
 return { ...state,...(state.scope!==scope?{ config:null,configLoading:true,configError:null,position:null,vaults:[],vault:null,status:'loading' as const,loading:true,paging:false,error:null,privateError:null,refreshedAt:null,nextCursor:null }:{}),api,subject,refresh,loadMore };
}
