import type { ComponentProps } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { X } from 'lucide-react-native';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { QrDepositPanel } from './qr-deposit-panel';

/** Receive gets a focused page; payment tracking still belongs to the wallet hook. */
export function ReceiveFundsScreen({ onClose, ...funding }: ComponentProps<typeof QrDepositPanel> & { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
    <GestureHandlerRootView style={styles.screen}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <AuthButton onPress={onClose} accessibilityRole="button" accessibilityLabel="Close receive screen" style={styles.close} testID="receive-close"><X size={23} color={W.ink} strokeWidth={1.8} /></AuthButton>
          <Text accessibilityRole="header" style={styles.title}>Receive funds</Text>
          <View style={styles.close} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} testID="receive-funds-screen">
          <QrDepositPanel {...funding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  </Modal>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dashboard.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingBottom: 16 },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: InterFont.semiBold, fontSize: 18, color: W.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: 12 },
});
