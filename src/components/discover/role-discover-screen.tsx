import { useAppRole } from '@/hooks/use-app-role';
import CaptainMarketsScreen from '@/components/markets/captain-markets-screen';
import DiscoverScreen from './discover-screen';

export default function RoleDiscoverScreen() {
  const role = useAppRole();
  return role === 'captain' ? <CaptainMarketsScreen key="captain" /> : <DiscoverScreen key="crew" />;
}
