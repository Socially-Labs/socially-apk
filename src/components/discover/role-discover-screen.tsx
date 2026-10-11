import { useAppRole } from '@/hooks/use-app-role';
import CaptainMarketsScreen from '@/components/markets/captain-markets-screen';
import CrewDiscoverScreen from './crew-discover-screen';

export default function RoleDiscoverScreen() {
  const role = useAppRole();
  return role === 'captain' ? <CaptainMarketsScreen key="captain" /> : <CrewDiscoverScreen key="crew" />;
}
