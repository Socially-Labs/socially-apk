import { useAuth } from '@/auth/session';
import { VaultListScreen } from '@/components/vaults/vault-screens';
import { useAppRole } from '@/hooks/use-app-role';
import CaptainMarketsScreen from '@/components/markets/captain-markets-screen';
import DiscoverScreen from './discover-screen';

export default function RoleDiscoverScreen() {
  const role = useAppRole();
  const { isAuthenticated }=useAuth();
  return role === 'captain' ? <CaptainMarketsScreen key="captain" /> : isAuthenticated ? <VaultListScreen key="crew" /> : <DiscoverScreen key="crew" />;
}
