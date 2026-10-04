import type { useEmailAuth } from '@/hooks/use-email-auth';
import type { ComponentProps } from 'react';
import type Animated from 'react-native-reanimated';

export type EmailAuth = ReturnType<typeof useEmailAuth>;
export type AuthTestIDPrefix = 'auth' | 'splash';
export type AuthControlAnimation = {
  enter?: ComponentProps<typeof Animated.View>['entering'];
  exit?: ComponentProps<typeof Animated.View>['exiting'];
  layout?: ComponentProps<typeof Animated.View>['layout'];
};
