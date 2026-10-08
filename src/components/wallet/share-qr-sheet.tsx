import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Download, Share2, X } from 'lucide-react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { SheetSurface, sheetMaterialStyle } from '@/components/shared/dashboard/sheet-surface';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { DashboardSheetTheme as S, WalletPalette as W } from '@/constants/theme';
import { ShareQrCard, type ShareQrDetails } from './share-qr-card';
import { saveQrImage, shareQrImage } from './share-qr-image';
import { GlacierQrCard, GLACIER_WIDTH } from './glacier-qr-card';
import { qrShareMessage } from './qr-share-message';

export function ShareQrSheet({ details, onClose, canShare = () => true }: {
  details: ShareQrDetails; onClose: () => void; canShare?: () => boolean;
}) {
  const insets = useSafeAreaInsets();
  const { width, height: viewportHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const cardWidth = Math.min(width - 56, 344);
  const card = useRef<View>(null), locked = useRef(false);
  const glacierCard = useRef<View>(null);
  const [glacierHeight, setGlacierHeight] = useState(0);
  const glacier = !details.amount && !details.mint;
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [logoReady, setLogoReady] = useState(false), [height, setHeight] = useState(0);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [copied, setCopied] = useState(false), [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => () => { if (copiedTimer.current) clearTimeout(copiedTimer.current); }, []);
  function available() { return canShare() && (!details.expiresAt || Date.parse(details.expiresAt) > Date.now()); }
  async function copy() {
    try {
      const success = await Clipboard.setStringAsync(details.address);
      if (!success) throw new Error('Clipboard unavailable');
      setError(null); setCopied(true); setMessage('Wallet address copied');
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => { setCopied(false); setMessage(null); }, 2500);
    } catch { setError('Couldn’t copy the address. You can select it and copy manually.'); }
  }
  async function exportImage(action: 'share' | 'save') {
    if (locked.current || !height || !logoReady || (glacier && !glacierHeight)) return;
    if (!available()) { setError('This request has ended. Create a new QR to share.'); return; }
    locked.current = true; setBusy(action); setError(null); setMessage(null);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    setCopied(false);
    try {
      // Commit hidden copy controls and wait for the QR/logo to finish painting.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!available()) throw new Error('This request has ended. Create a new QR to share.');
      const exportCard = glacier ? glacierCard : card;
      const exportHeight = glacier ? glacierHeight : height;
      const exportWidth = glacier ? GLACIER_WIDTH : cardWidth;
      if (action === 'save') {
        await saveQrImage(exportCard, exportHeight, available, exportWidth);
        setMessage(Platform.OS === 'web' ? 'Image downloaded' : 'Image saved to Photos');
      } else await shareQrImage(exportCard, exportHeight, available, exportWidth, qrShareMessage(details));
    } catch (cause) {
      const text = cause instanceof Error ? cause.message : '';
      setError(text.includes('request has ended') || text.includes('Allow photo') ? text : `Couldn’t ${action} the image. Try again, or copy the wallet address.`);
    } finally { locked.current = false; setBusy(null); }
  }
  const disabled = !!busy || !height || !logoReady || (glacier && !glacierHeight);
  return <Modal visible transparent statusBarTranslucent navigationBarTranslucent animationType="fade" onRequestClose={() => { if (!locked.current) onClose(); }}>
    <View style={s.screen} testID="share-qr-preview">
      {glacier ? <View style={s.exportCanvas} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden>
        <GlacierQrCard ref={glacierCard} details={details} onLayoutReady={setGlacierHeight} />
      </View> : null}
      <Pressable style={StyleSheet.absoluteFill} disabled={!!busy} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss QR sharing" />
      <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(280)} style={[s.frame, sheetMaterialStyle, { maxHeight: viewportHeight - Math.max(insets.top, 24) - 20, paddingBottom: Math.max(insets.bottom, 12) }]} accessibilityViewIsModal testID="share-qr-sheet">
        <SheetSurface />
        <View style={s.handleArea}><View style={s.handle} /></View>
        <View style={s.header}><View style={s.heading}><Text style={s.title}>Share your QR</Text><Text style={s.subtitle}>Let others scan to send you assets.</Text></View><AuthButton disabled={!!busy} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close QR sharing" style={s.close}><X color={W.ink} size={23} /></AuthButton></View>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <ShareQrCard ref={card} details={details} width={cardWidth} exporting={!!busy} copied={copied} onCopy={() => { void copy(); }} onLogoReady={() => setLogoReady(true)} onLayoutReady={setHeight} />
        </ScrollView>
        <View style={s.actions}>
          {error ? <Text style={s.error} accessibilityRole="alert">{error}</Text> : null}
          {message ? <Text style={s.feedback} accessibilityLiveRegion="polite">{message}</Text> : null}
          <View style={s.actionRow}>
            <AuthButton testID="save-qr-image" accessibilityRole="button" accessibilityLabel="Save QR image" accessibilityState={{ disabled, busy: busy === 'save' }} disabled={disabled} onPress={() => { void exportImage('save'); }} style={[s.saveButton, disabled && s.disabled]}>
              {busy === 'save' ? <ActivityIndicator color={W.receiveQrInk} /> : <Download color={W.receiveQrInk} size={19} />}<Text style={s.saveText}>Save image</Text>
            </AuthButton>
            <AuthButton testID="share-qr-image" accessibilityRole="button" accessibilityLabel="Share branded QR image" accessibilityState={{ disabled, busy: busy === 'share' }} disabled={disabled} onPress={() => { void exportImage('share'); }} style={[s.button, disabled && s.disabled]}>
              {busy === 'share' ? <ActivityIndicator color={W.heroInk} /> : <Share2 color={W.heroInk} size={19} />}<Text style={s.buttonText}>Share image</Text>
            </AuthButton>
          </View>
        </View>
      </Animated.View>
    </View>
  </Modal>;
}
const s = StyleSheet.create({
  exportCanvas: { position: 'absolute', left: -10000, top: 0 },
  screen: { flex: 1, backgroundColor: S.backdrop, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 8, paddingBottom: 8 },
  frame: { width: '100%', maxWidth: 414, borderRadius: 32, borderWidth: 1, borderColor: S.border, overflow: 'hidden', boxShadow: S.shadow },
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 38, height: 4, borderRadius: 2, backgroundColor: S.handle },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  heading: { flex: 1, gap: 6 },
  title: { fontFamily: BrandFont.editorial, fontSize: 34, lineHeight: 40, color: W.ink },
  subtitle: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 19, color: W.secondary },
  close: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: W.receiveGlass.border, backgroundColor: W.receivePill, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  content: { alignItems: 'center', paddingTop: 4, paddingBottom: 16 },
  actions: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, gap: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1.2, minHeight: 54, paddingHorizontal: 8, backgroundColor: W.receiveCard, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  saveButton: { flex: 1, minHeight: 54, paddingHorizontal: 8, borderWidth: 1, borderColor: W.shareCard.line, borderRadius: 28, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { fontFamily: InterFont.semiBold, fontSize: 13, color: W.heroInk, flexShrink: 1 },
  saveText: { fontFamily: InterFont.medium, fontSize: 13, color: W.receiveQrInk, flexShrink: 1 },
  disabled: { opacity: 0.55 },
  feedback: { fontFamily: InterFont.medium, fontSize: 12, lineHeight: 18, color: W.gain, textAlign: 'center' },
  error: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: W.error, textAlign: 'center' },
});
