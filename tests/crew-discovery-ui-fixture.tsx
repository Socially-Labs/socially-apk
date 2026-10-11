// Browser-only harness; uses the shipping navigation without the sign-in flow.
// @ts-expect-error Existing browser harnesses use the installed React DOM client.
import { createRoot } from 'react-dom/client';
import { ExpoRoot,Stack,useLocalSearchParams } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import { AppFontMap } from '@/constants/fonts';
import VoyageTabs from '@/components/shared/navigation/voyage-tabs';
import CrewDiscoverScreen from '@/components/discover/crew-discover-screen';
import CrewCaptainScreen from '@/components/discover/crew-captain-screen';
function Layout(){const [loaded]=useFonts(AppFontMap);return loaded?<SafeAreaProvider><Stack screenOptions={{headerShown:false,animation:'none'}}/></SafeAreaProvider>:null;}
function Captain(){const {id}=useLocalSearchParams<{id:string}>();return <CrewCaptainScreen id={id}/>;}
const Empty=()=> <Text>Navigation destination</Text>;
const modules:Record<string,{default:()=>React.JSX.Element|null}>={
 './_layout.tsx':{default:Layout},'./(app)/_layout.tsx':{default:VoyageTabs},'./(app)/index.tsx':{default:Empty},
 './(app)/explore.tsx':{default:CrewDiscoverScreen},'./(app)/wallet.tsx':{default:Empty},'./(app)/settings.tsx':{default:Empty},
 './captain/[id].tsx':{default:Captain},'./vaults/[id].tsx':{default:Empty},
};
const context=Object.assign((key:string)=>modules[key],{keys:()=>Object.keys(modules),resolve:(key:string)=>key,id:'crew-discovery-fixture'});
createRoot(document.getElementById('root')!).render(<ExpoRoot context={context}/>);
