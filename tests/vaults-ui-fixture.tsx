// Browser-only integration harness. Never imported by the production entrypoint.
// @ts-expect-error Browser-only harness follows the existing React DOM fixture pattern.
import { createRoot } from 'react-dom/client';
import { ExpoRoot,Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { AuthContext } from '@/auth/session';
import { BackendAccountProvider } from '@/auth/backend-account-provider';
import { SettingsProvider } from '@/components/settings/settings-provider';
import { AppFontMap } from '@/constants/fonts';
import { VaultCreateScreen,VaultDetailScreen,VaultListScreen } from '@/components/vaults/vault-screens';
function Layout() {
 useFonts(AppFontMap);
 return <SafeAreaProvider><AuthContext.Provider value={{ isReady:true,isConfigured:true,isAuthenticated:true,accountId:'did:privy:vault-fixture',email:'captain@example.com',
  sendCode:async()=>{},verifyCode:async()=>{},loginWithSocial:async()=>{},oauthPending:false,oauthError:null,logout:async()=>{},getAccessToken:async()=> 'vault-fixture' }}>
  <BackendAccountProvider><SettingsProvider><Stack screenOptions={{ headerShown:false,animation:'none' }} /></SettingsProvider></BackendAccountProvider>
 </AuthContext.Provider></SafeAreaProvider>;
}
const modules:Record<string,{ default:()=>React.JSX.Element }>={ './_layout.tsx':{ default:Layout },'./index.tsx':{ default:VaultListScreen },
 './vaults/index.tsx':{ default:VaultListScreen },'./vaults/create.tsx':{ default:VaultCreateScreen },'./vaults/[id].tsx':{ default:VaultDetailScreen } };
const context=Object.assign((key:string)=>modules[key],{ keys:()=>Object.keys(modules),resolve:(key:string)=>key,id:'vault-ui-fixture' });
createRoot(document.getElementById('root')!).render(<ExpoRoot context={context} />);
