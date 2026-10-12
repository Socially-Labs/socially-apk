import { useEffect,useRef,useState } from 'react';
import { CryptoDigestAlgorithm,digestStringAsync,randomUUID } from 'expo-crypto';
import { ApiError } from '@/api/client';
import { orderStorage } from '@/api/market-order-storage';
import { parseVaultAttempt,submitVaultAttempt,type VaultAttempt } from '@/api/vault-journal';
import type { VaultIntent,VaultOperation,vaultsApi } from '@/api/vaults';
export function useVaultIntent(api:ReturnType<typeof vaultsApi>,subject:string|null,scope:string,onSuccess:(id:string,operation:VaultOperation)=>void) {
 const [state,setState]=useState<{ ready:boolean; busy:boolean; attempt:VaultAttempt|null; error:string|null }>({ ready:false,busy:false,attempt:null,error:null });
 const identity=`${subject}:PAPER:${scope}`,boundIdentity=useRef<string|null>(null);
 const epoch=useRef(0),locked=useRef(false),attempt=useRef<VaultAttempt|null>(null),storageKey=useRef<string|null>(null),controller=useRef<AbortController|null>(null);
 const notify=useRef(onSuccess); notify.current=onSuccess;
 useEffect(()=>{
  const generation=++epoch.current,request=new AbortController(); controller.current=request;
  boundIdentity.current=identity;
  locked.current=false; attempt.current=null; storageKey.current=null;
  const valid=()=>epoch.current===generation && !request.signal.aborted;
  const recover=async()=>{
   setState({ ready:false,busy:false,attempt:null,error:null });
   if (!subject) return;
   try {
    const hash=await digestStringAsync(CryptoDigestAlgorithm.SHA256,`${subject}:PAPER:${scope}`);
    const key=`vault.intent.${hash}`,raw=await orderStorage.read(key);
    if (!valid()) return;
    storageKey.current=key;
    if (raw) {
     const saved=parseVaultAttempt(raw,subject); attempt.current=saved;
     try {
      const result=await api.recover(saved.key,request.signal);
      if (!valid()) return;
      if (result.kind!==saved.intent.kind || saved.intent.kind!=='CREATE' && result.vaultId!==saved.intent.vaultId) throw new Error('Recovered operation does not match this request.');
      await orderStorage.remove(key);
      if (!valid()) return;
      attempt.current=null; notify.current(result.vaultId,result);
     } catch (error) {
      if (error instanceof ApiError && error.code==='vault_request_rejected') {
       await orderStorage.remove(key);
       if (!valid()) return;
       attempt.current=null;
       setState({ ready:true,busy:false,attempt:null,error:error.message });
       return;
      }
      if (!(error instanceof ApiError && error.status===404)) throw error;
     }
    }
    if (valid()) setState({ ready:true,busy:false,attempt:attempt.current,error:attempt.current?'A request needs confirmation. Retry the saved request.':null });
   } catch (error) { if (valid()) setState({ ready:false,busy:false,attempt:attempt.current,error:error instanceof Error?error.message:'Could not restore your vault request.' }); }
  };
  void recover();
  return ()=>{ epoch.current=generation+1; request.abort(); };
 },[api,subject,scope,identity]);
 const submit=async(intent:VaultIntent)=>{
  if (boundIdentity.current!==identity || !subject || !state.ready || locked.current || !storageKey.current) return;
  const generation=epoch.current,key=storageKey.current,signal=controller.current?.signal;
  locked.current=true;
  const saved=attempt.current ?? { subject,mode:'PAPER' as const,key:randomUUID(),intent };
  attempt.current=saved; setState(s=>({ ...s,busy:true,attempt:saved,error:null }));
  try {
   const result=await submitVaultAttempt(api,orderStorage,key,saved,signal);
   if (generation!==epoch.current) return;
   attempt.current=null; setState({ ready:true,busy:false,attempt:null,error:null }); notify.current(result.vaultId,result);
  } catch (error) {
   if (generation!==epoch.current) return;
   if (error instanceof ApiError && error.code==='vault_request_rejected') attempt.current=null;
   setState(s=>({ ...s,attempt:attempt.current,error:error instanceof Error?error.message:'Request outcome is uncertain. Retry the saved request.' }));
  } finally { if (generation===epoch.current) { locked.current=false; setState(s=>({ ...s,busy:false })); } }
 };
 return { ...state,...(boundIdentity.current!==identity?{ ready:false,busy:false,attempt:null,error:null }:{}),submit };
}
