import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/auth/session';
import { createApiClient } from '@/api/client';
import { paperPortfolioApi } from '@/api/paper-portfolio';
import { DashboardSheetTheme as C } from '@/constants/theme/dashboard';
import { InterFont } from '@/constants/fonts';

// Paper trading is the default. Preparing its balance requires no onboarding step.
export function PaperBalanceSetup({ onReady }: { onReady: () => void }) {
  const auth = useAuth();
  return <Setup key={auth.accountId ?? 'signed-out'} onReady={onReady} />;
}

function Setup({ onReady }: { onReady: () => void }) {
  const auth = useAuth();
  const notify = useRef(onReady);
  useEffect(() => { notify.current = onReady; }, [onReady]);
  const api = useMemo(() => paperPortfolioApi(createApiClient({
    origin: process.env.EXPO_PUBLIC_API_URL,
    getAccessToken: auth.getAccessToken,
    timeoutMs: 30000,
  })), [auth.getAccessToken]);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function prepare() {
      try {
        let portfolio = await api.read(controller.signal);
        if (controller.signal.aborted) return;
        if (!portfolio.initialized) {
          if (!portfolio.enabled) throw new Error('Trading is temporarily unavailable.');
          // Wallet provisioning can finish after the screen mounts. Retry automatically
          // when its address arrives rather than presenting a setup button.
          if (!auth.solanaAddress) return;
          portfolio = await api.initialize(auth.solanaAddress, controller.signal);
        }
        if (!controller.signal.aborted) {
          if (!portfolio.initialized) throw new Error('Could not prepare your trading balance.');
          setError(null);
          notify.current();
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'Could not load your available balance.');
        }
      }
    }
    void prepare();
    return () => controller.abort();
  }, [api, auth.solanaAddress, revision]);

  if (!error) return null;
  return <View style={s.errorRow}>
    <Text accessibilityRole="alert" style={s.error}>{error}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Retry available balance" onPress={() => {
      setError(null);
      setRevision(value => value + 1);
    }} style={s.retry}><Text style={s.retryText}>Retry</Text></Pressable>
  </View>;
}

const s = StyleSheet.create({
  errorRow: { gap: 8 },
  error: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: C.negative },
  retry: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 12 },
  retryText: { fontFamily: InterFont.semiBold, fontSize: 13, color: C.ink },
});
