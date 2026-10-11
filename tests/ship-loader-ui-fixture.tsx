// Browser-only fixture: no wallet action is sent.
// @ts-expect-error Browser harnesses use the installed React DOM client.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ExpoRoot, Stack, router, useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Pressable, ScrollView, Text } from 'react-native';
import { AppFontMap } from '@/constants/fonts';
import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { RefreshIndicatorContext } from '@/components/shared/refresh/refresh-indicator-context';
import { SwapSheet } from '@/components/wallet/swap-sheet';

function Layout() {
  const [loaded] = useFonts(AppFontMap);
  return loaded ? <SafeAreaProvider><GestureHandlerRootView style={{ flex: 1 }}><Stack screenOptions={{ headerShown: false, animation: 'none' }}/></GestureHandlerRootView></SafeAreaProvider> : null;
}
function Screen() {
  const {swap:initialSwap}=useLocalSearchParams<{swap?:string}>();
  const [swapPhase,setSwapPhase] = useState<'preparing'|'signing'|'sending'|'pending'|'confirmed'|null>(()=>
    initialSwap==='preparing'||initialSwap==='signing'||initialSwap==='sending'||initialSwap==='pending'||initialSwap==='confirmed'?initialSwap:null);
  const [suppressed,setSuppressed] = useState(false);
  const swap = { phase: swapPhase??'editing', input:'SOL', output:'USDC', amount:'1', locked:true,
    busy: swapPhase==='preparing'||swapPhase==='signing'||swapPhase==='sending', canSubmit:false, expired:false,
    quote:null, quoting:false, validation:null, error:null, signature:null, edit:()=>{}, max:()=>{}, reverse:()=>{},
    pauseQuoteUpdates:()=>{}, submit:async()=>{}, reset:()=>{}, refreshQuote:()=>{} };
  return <ScrollView contentContainerStyle={{padding:20, gap:12}}>
    <Pressable testID="loader-away" onPress={()=>router.push('./away')}><Text>Open another screen</Text></Pressable>
    <Pressable testID="loader-suppress" onPress={()=>setSuppressed(v=>!v)}><Text>Toggle pull indicator ownership</Text></Pressable>
    <RefreshIndicatorContext value={suppressed}><ShipLoader compact label="Loading more results…"/></RefreshIndicatorContext>
    {(['preparing','signing','sending','pending','confirmed'] as const).map(value=><Pressable key={value} testID={`swap-${value}`} onPress={()=>setSwapPhase(value)}><Text>Swap {value}</Text></Pressable>)}
    <SwapSheet visible={swapPhase!==null} swap={swap as never} balances={{amount:'5',usdcAmount:'100'} as never}
      balanceVisible onClose={()=>setSwapPhase(null)}/>
  </ScrollView>;
}
function Away() { return <Pressable testID="loader-back" onPress={()=>router.back()}><Text>Back</Text></Pressable>; }
const modules = { './_layout.tsx':{default:Layout}, './ship-test.tsx':{default:Screen}, './away.tsx':{default:Away} };
const context = Object.assign((key:string)=>modules[key as keyof typeof modules], {keys:()=>Object.keys(modules),resolve:(key:string)=>key,id:'ship-loader-fixture'});
createRoot(document.getElementById('root')!).render(<ExpoRoot context={context}/>);
