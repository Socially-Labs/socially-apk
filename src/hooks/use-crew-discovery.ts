import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { type DiscoveryItem, type DiscoveryFilters, fetchCaptains, fetchDiscoveryVaults } from '@/api/crew-discovery';

export function useCrewDiscovery(tab:'captains'|'vaults',query:string,filters:DiscoveryFilters,captainId?:string,sort='RECENT'){
 const scope=JSON.stringify([tab,query,filters.phase,filters.duration,filters.sort,captainId,sort]);
 const [state,setState]=useState<{scope:string;items:DiscoveryItem[];nextCursor:string|null;status:'loading'|'success'|'error';loading:boolean;loadingMore:boolean;error:string|null}>({scope:'',items:[],nextCursor:null,status:'loading',loading:true,loadingMore:false,error:null});
 const [revision,setRevision]=useState(0);
 const epoch=useRef(0),active=useRef<AbortController|null>(null),moreLock=useRef(false),refreshing=useRef(false),pages=useRef(1);
 const read=useCallback((after:string|null,signal:AbortSignal)=>tab==='captains'?fetchCaptains(query,after,signal,sort):fetchDiscoveryVaults(query,{phase:filters.phase,duration:filters.duration,sort:filters.sort},captainId,after,signal),[tab,query,filters.phase,filters.duration,filters.sort,captainId,sort]);
 useFocusEffect(useCallback(()=>{
  void revision;pages.current=1;
  setState(s=>s.scope===scope?{...s,status:s.status==='success'?'success':'loading',loading:true,loadingMore:false,error:null}:{scope,items:[],nextCursor:null,status:'loading',loading:true,loadingMore:false,error:null});
  const foreground=()=>AppState.currentState==null||AppState.currentState==='active';
  const refresh=async()=>{
   if(!foreground()||moreLock.current||refreshing.current)return;
   refreshing.current=true;active.current?.abort();
   setState(s=>({...s,loading:true}));
   const generation=++epoch.current,controller=new AbortController();active.current=controller;
   try{
    // Reload the loaded page chain atomically. Polling must not discard page two
    // or combine a new ranking with an old pagination cursor.
    const items:DiscoveryItem[]=[];let nextCursor:string|null=null,loaded=0;
    do{
     const page=await read(nextCursor,controller.signal);items.push(...page.items.filter(v=>!items.some(old=>old.id===v.id)));
     nextCursor=page.nextCursor;loaded++;
    }while(nextCursor&&loaded<pages.current);
    if(epoch.current===generation&&!controller.signal.aborted){pages.current=loaded;setState({scope,items,nextCursor,status:'success',loading:false,loadingMore:false,error:null});}
   }catch(e){if(epoch.current===generation&&!controller.signal.aborted)setState(s=>({...s,status:'error',loading:false,error:e instanceof Error?e.message:'Could not load Discover.'}));}
   finally{if(epoch.current===generation)refreshing.current=false;}
  };
  void refresh();const timer=setInterval(()=>{void refresh();},30000);
  const subscription=AppState.addEventListener('change',status=>{
   if(status==='active'){void refresh();return;}
   epoch.current++;active.current?.abort();moreLock.current=false;refreshing.current=false;
   setState(s=>({...s,loading:false,loadingMore:false}));
  });
  return()=>{clearInterval(timer);subscription.remove();epoch.current++;active.current?.abort();moreLock.current=false;refreshing.current=false;};
 },[scope,read,revision]));
 const loadMore=async()=>{
  if(state.scope!==scope||state.loading||!state.nextCursor||moreLock.current||refreshing.current||!active.current||active.current.signal.aborted)return;
  moreLock.current=true;const generation=epoch.current;setState(s=>({...s,loadingMore:true,error:null}));
  try{const page=await read(state.nextCursor,active.current.signal);if(epoch.current===generation){pages.current++;setState(s=>({...s,items:[...s.items,...page.items.filter(v=>!s.items.some(old=>old.id===v.id))],nextCursor:page.nextCursor,loadingMore:false}));}}
  catch(e){if(epoch.current===generation)setState(s=>({...s,loadingMore:false,error:e instanceof Error?e.message:'Could not load more.'}));}
  finally{if(epoch.current===generation)moreLock.current=false;}
 };
 return {...state,...(state.scope!==scope?{items:[],nextCursor:null,status:'loading' as const,loading:true,error:null}:{}),loadMore,refresh:()=>setRevision(v=>v+1)};
}
