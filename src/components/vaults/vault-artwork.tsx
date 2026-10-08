import { useEffect,useRef,useState } from 'react';
import { Pressable,Text,View } from 'react-native';
import type { vaultsApi } from '@/api/vaults';
import { pickProfileMedia } from '@/components/settings/profile-media';
import { readProfileUpload,uploadFetch } from '@/components/settings/profile-upload';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
export function VaultArtwork({ api,id,onSaved }:{ api:ReturnType<typeof vaultsApi>; id:string; onSaved:()=>void }) {
 const controller=useRef<AbortController|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 useEffect(()=>()=>{ controller.current?.abort(); controller.current=null; },[]);
 const choose=async(kind:'avatar'|'banner')=>{
  controller.current?.abort(); const own=new AbortController(); controller.current=own; setBusy(true); setError(null);
  const timeout=setTimeout(()=>own.abort(),90_000);
  try {
   const uri=await pickProfileMedia(kind==='avatar'?'photo':'banner');
   if (!uri || own.signal.aborted) return;
   const file=await readProfileUpload(uri,own.signal);
   await api.uploadImage(id,kind,file,uploadFetch,own.signal);
   if (!own.signal.aborted) onSaved();
  } catch (error) { if (controller.current===own) setError(error instanceof Error?error.message:'Could not save vault artwork.'); }
  finally { clearTimeout(timeout); if (controller.current===own) setBusy(false); }
 };
 return <View style={{ gap:12 }}><Text style={{ color:C.ink }}>Optional vault artwork</Text>
  <Text style={{ color:C.secondary }}>Add images after funding is confirmed. They belong to this vault; your profile stays unchanged.</Text>
  {(['avatar','banner'] as const).map(kind=><Pressable key={kind} accessibilityRole="button" accessibilityState={{ disabled:busy }} disabled={busy} onPress={()=>{ void choose(kind); }} style={{ minHeight:48,justifyContent:'center',padding:12,borderRadius:16,backgroundColor:C.periodSelected }}><Text style={{ color:C.ink }}>{busy?'Saving artwork…':kind==='avatar'?'Choose vault image':'Choose vault banner'}</Text></Pressable>)}
  {error?<Text accessibilityRole="alert" style={{ color:C.negative }}>{error}</Text>:null}
 </View>;
}
