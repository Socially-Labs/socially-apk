import AppTabs from '@/components/shared/navigation/app-tabs';
import { HomePreviewProvider } from '@/components/dev/home-preview-provider';

export default function AppLayout() {
  return __DEV__ ? <HomePreviewProvider><AppTabs /></HomePreviewProvider> : <AppTabs />;
}
