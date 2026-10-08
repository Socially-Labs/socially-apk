import { useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Bell, Info, X } from 'lucide-react-native';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { QrDepositPanel } from './qr-deposit-panel';
import { WalletAddressPanel } from './wallet-address-panel';

/** Receive gets a focused page; payment tracking still belongs to the wallet hook. */
export function ReceiveFundsScreen({ onClose, wallet, ...funding }: Omit<ComponentProps<typeof QrDepositPanel>, 'details' | 'onCloseDetails'> & {
  onClose: () => void; wallet?: Omit<ComponentProps<typeof WalletAddressPanel>, 'info' | 'onCloseInfo'>;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [details, setDetails] = useState<'info' | 'status' | null>(null);
  const sceneryHeight = Math.max(440, height * 0.72);
  return <Modal visible animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Image source={require('@/assets/images/home/crew-harbor.webp')} contentFit="cover" contentPosition={{ left: '60%', top: '42%' }} transition={0} style={[styles.scenery, { height: sceneryHeight }]} />
        <View style={[styles.scenery, styles.veil, { height: sceneryHeight }]} />
        <LinearGradient colors={W.receiveGlass.fade} locations={[0, 0.6, 1]} style={[styles.scenery, { top: sceneryHeight * 0.3, height: sceneryHeight * 0.7 }]} />
      </View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { marginTop: Math.max(insets.top + 8, 24) }]}>
          <View pointerEvents="none" style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Receive</Text></View>
          <AuthButton onPress={onClose} accessibilityRole="button" accessibilityLabel="Close receive screen" style={styles.close} testID="receive-close"><X size={23} color={W.ink} strokeWidth={1.8} /></AuthButton>
          <View style={styles.tools}>
            {wallet ? null : <AuthButton onPress={() => setDetails('status')} accessibilityRole="button" accessibilityLabel="Payment notifications" style={styles.close} testID="receive-notifications"><Bell size={22} color={W.ink} strokeWidth={1.7} /></AuthButton>}
            <AuthButton onPress={() => setDetails('info')} accessibilityRole="button" accessibilityLabel="About receiving funds" style={styles.close} testID="receive-info"><Info size={22} color={W.ink} strokeWidth={1.7} /></AuthButton>
          </View>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: Math.min(108, height * 0.13), paddingBottom: Math.max(insets.bottom, 20) + 20 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false} testID="receive-funds-screen">
          {wallet ? <WalletAddressPanel key={wallet.address} {...wallet} info={details === 'info'} onCloseInfo={() => setDetails(null)} /> : <QrDepositPanel {...funding} details={details} onCloseDetails={() => setDetails(null)} />}
        </ScrollView>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  </Modal>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Dashboard.background },
  keyboard: { flex: 1 },
  scenery: { position: 'absolute', top: 0, left: 0, width: '100%' },
  veil: { backgroundColor: W.receiveGlass.veil },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, maxWidth: 430, width: '90%', alignSelf: 'center' },
  heading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  tools: { flexDirection: 'row', gap: 8 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: W.surface, borderWidth: 1, borderColor: W.receiveGlass.border, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', fontFamily: InterFont.semiBold, fontSize: 18, color: W.ink },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
});
