// Browser-only preview of the production boot artwork; never an app entrypoint.
// @ts-expect-error Existing browser fixture pattern uses React DOM client.
import { createRoot } from 'react-dom/client';
import { View } from 'react-native';
import { BootLoadingScreen } from '@/components/auth/splash/boot-loading-screen';

createRoot(document.getElementById('root')!).render(
  <View style={{ flex: 1 }}><BootLoadingScreen /></View>,
);
