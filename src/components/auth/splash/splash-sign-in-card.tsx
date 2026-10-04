import type { SharedValue } from 'react-native-reanimated';

import { SignInLayout } from '@/components/auth/sign-in-layout';

export function SplashSignInCard({ reveal }: { reveal: SharedValue<number> }) {
  return <SignInLayout reveal={reveal} testIDPrefix="splash" />;
}
