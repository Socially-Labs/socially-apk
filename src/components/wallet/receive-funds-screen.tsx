import { KeyboardScrollView } from '@/components/shared/keyboard/keyboard-scroll-view';
import { useState, type ComponentProps } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Info, X } from 'lucide-react-native';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette as W } from '@/constants/theme';
import { WalletAddressPanel } from './wallet-address-panel';

/** Receive SOL and Circle USDC directly into the embedded devnet wallet. */
export function ReceiveFundsScreen({ onClose, wallet }: {
  onClose: () => void; wallet: Omit<ComponentProps<typeof WalletAddressPanel>, 'info' | 'onCloseInfo'>;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [details, setDetails] = useState<'info' | null>(null);
  const sceneHeight = Platform.OS === 'web' ? height : Dimensions.get('screen').height;
  const sceneryHeight = Math.max(440, sceneHeight * 0.72);
  function close() { Keyboard.dismiss(); onClose(); }
  return <Modal visible animationType="slide" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
    <GestureHandlerRootView style={styles.screen}>
      <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Image source={require('@/assets/images/home/crew-harbor.webp')} contentFit="cover" contentPosition={{ left: '60%', top: '42%' }} transition={0} style={[styles.scenery, { height: sceneryHeight }]} />
        <View style={[styles.scenery, styles.veil, { height: sceneryHeight }]} />
        <LinearGradient colors={W.receiveGlass.fade} locations={[0, 0.6, 1]} style={[styles.scenery, { top: sceneryHeight * 0.3, height: sceneryHeight * 0.7 }]} />
      </View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { marginTop: Math.max(insets.top + 8, 24) }]}>
          <View pointerEvents="none" style={styles.heading}><Text accessibilityRole="header" style={styles.title}>Receive</Text></View>
          <AuthButton onPress={close} accessibilityRole="button" accessibilityLabel="Close receive screen" style={styles.close} testID="receive-close"><X size={23} color={W.ink} strokeWidth={1.8} /></AuthButton>
          <View style={styles.tools}>
            <AuthButton onPress={() => setDetails('info')} accessibilityRole="button" accessibilityLabel="About receiving funds" style={styles.close} testID="receive-info"><Info size={22} color={W.ink} strokeWidth={1.7} /></AuthButton>
          </View>
        </View>
        <KeyboardScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: Math.min(108, sceneHeight * 0.13), paddingBottom: Math.max(insets.bottom, 20) + 20 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false} testID="receive-funds-screen">
          <WalletAddressPanel key={wallet.address} {...wallet} info={details === 'info'} onCloseInfo={() => setDetails(null)} />
        </KeyboardScrollView>
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
