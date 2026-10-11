import { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle, Path } from 'react-native-svg';
import { CopyMorphIcon } from './copy-morph-icon';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';

export type ShareQrDetails = {
  value: string; address: string; title: string; network: string;
  note: string; amount?: string; expiresAt?: string; mint?: string; ownerName?: string; ownerPhotoUri?: string | null; ownerFallbackId?: number;
};

/** The capture boundary excludes app chrome; copy controls disappear during capture. */
export const ShareQrCard = forwardRef<View, {
  details: ShareQrDetails; width?: number; exporting?: boolean; copied?: boolean;
  onCopy?: () => void; onLogoReady: () => void;
  onLayoutReady: (height: number) => void;
}>(function ShareQrCard({ details, width = 320, exporting = false, copied = false, onCopy, onLogoReady, onLayoutReady }, ref) {
  const qrSize = Math.min(220, width - 88);
  const previewAddress = details.address.length > 20 ? `${details.address.slice(0, 8)}…${details.address.slice(-8)}` : details.address;
  return <View ref={ref} collapsable={false} style={[s.card, { width }]} testID="share-qr-card"
    onLayout={event => onLayoutReady(event.nativeEvent.layout.height)}>
    <View style={s.header}>
      <View style={s.brand}>
        <Image source={require('@/assets/images/splash-icon.png')} style={s.logo} contentFit="contain" transition={0} onLoad={onLogoReady} onError={onLogoReady} accessibilityLabel="Socially" />
        <Text style={s.wordmark}>SOCIALLY</Text>
      </View>
      <View style={s.networkPill}><View style={s.networkDot} /><Text style={s.network}>{details.network}</Text></View>
      <Svg width="76" height="76" viewBox="0 0 76 76" style={s.compass} accessible={false}>
        <Circle cx="38" cy="38" r="26" stroke={W.heroLine} fill="none" />
        <Path d="M38 3L44 32L73 38L44 44L38 73L32 44L3 38L32 32Z M38 3V73 M3 38H73" stroke={W.heroLine} fill="none" />
      </Svg>
      <Svg width={width} height="15" viewBox={`0 0 ${width} 15`} style={s.wave} accessible={false}>
        <Path d={`M0 10Q${width / 2} -6 ${width} 10V15H0Z`} fill={W.white} />
      </Svg>
    </View>
    <View style={s.body}>
      <Text style={s.title}>{details.amount ? details.title : 'Receive on Solana'}</Text>
      {details.amount ? <Text style={s.amount}>{details.amount}</Text> : null}
      <View style={s.qr} testID="share-qr-code"><QRCode value={details.value} size={qrSize} quietZone={16} color={W.receiveQrInk} backgroundColor={W.white} ecl="M" /></View>
      <View style={s.addressBox}>
        <Text style={s.label}>{details.amount ? 'Payment recipient' : 'Wallet Address:'}</Text>
        <View style={s.addressHeading}>
          <Text selectable numberOfLines={exporting ? undefined : 1} ellipsizeMode="middle" accessibilityLabel={details.address} style={[s.address, !exporting && s.previewAddress]} testID="share-qr-address">{exporting ? details.address : previewAddress}</Text>
          {onCopy && !exporting ? <AuthButton testID="share-qr-copy" disabled={exporting} onPress={onCopy} accessibilityRole="button" accessibilityLabel={copied ? 'Wallet address copied' : 'Copy wallet address'} style={s.copy}>
            <CopyMorphIcon copied={copied} />
          </AuthButton> : null}
        </View>
      </View>
      <View style={s.networkNote}><View style={s.noteDot} /><Text style={s.noteText}>{details.mint ? 'Solana devnet · Test tokens only' : 'Solana network only'}</Text></View>
      {details.mint ? <View style={s.tokenBox}><Text style={s.label}>Test USDC mint · 6 decimals</Text><Text selectable style={s.mint}>{details.mint}</Text></View> : null}
      {details.amount ? <Text style={s.note}>{details.note}</Text> : null}
      {details.expiresAt ? <Text style={s.expiry}>Valid until {new Date(details.expiresAt).toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC')}</Text> : null}
    </View>
  </View>;
});
const s = StyleSheet.create({
  card: { backgroundColor: W.white, borderRadius: 26, overflow: 'hidden', borderWidth: 1, borderColor: W.receiveGlass.border },
  header: { backgroundColor: W.receiveCard, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 25, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 },
  logo: { width: 36, height: 36, borderRadius: 10 },
  wordmark: { fontFamily: BrandFont.wordmark, fontSize: 16, letterSpacing: 2.5, color: W.heroInk },
  networkPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 20, backgroundColor: W.heroPill, flexShrink: 1 },
  networkDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: W.heroPositive },
  network: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 14, color: W.heroInk, flexShrink: 1 },
  compass: { position: 'absolute', right: 4, top: 3, pointerEvents: 'none' },
  wave: { position: 'absolute', bottom: -1, left: 0, pointerEvents: 'none' },
  body: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 20 },
  title: { fontFamily: BrandFont.editorial, fontSize: 30, lineHeight: 35, color: W.ink, textAlign: 'center' },
  amount: { fontFamily: InterFont.semiBold, fontSize: 20, lineHeight: 28, color: W.ink, marginTop: 6 },
  qr: { backgroundColor: W.white, marginVertical: 12 },
  addressBox: { width: '100%', borderTopWidth: 1, borderBottomWidth: 1, borderColor: W.shareCard.line, paddingTop: 16, paddingBottom: 12, gap: 4 },
  addressHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 8 },
  label: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 14, letterSpacing: 1.1, color: W.secondary },
  previewAddress: { flex: 1, width: undefined, minWidth: 0 },
  copy: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: W.receivePill },
  // Long base58 addresses must wrap on web as well as native, never truncate.
  address: { width: '100%', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 13, lineHeight: 21, color: W.ink, ...Platform.select({ web: { overflowWrap: 'anywhere' as const } }) },
  networkNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  noteDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: W.receiveQrInk },
  noteText: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: W.secondary, flexShrink: 1 },
  tokenBox: { width: '100%', marginTop: 16, gap: 6 },
  mint: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 17, color: W.secondary, ...Platform.select({ web: { overflowWrap: 'anywhere' as const } }) },
  note: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 17, color: W.ink, textAlign: 'center', marginTop: 14 },
  expiry: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 15, color: W.secondary, textAlign: 'center', marginTop: 10 },
});
