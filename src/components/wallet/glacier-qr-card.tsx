import { forwardRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle, Path } from 'react-native-svg';
import { BrandFont, InterFont } from '@/constants/fonts';
import { WalletPalette as W } from '@/constants/theme';
import type { ShareQrDetails } from './share-qr-card';
import { SociallyEmblem, qrEmblemSvg } from './socially-emblem';

export const GLACIER_WIDTH = 360;

/** A fixed-size export canvas: real QR data and full address, without sheet controls. */
export const GlacierQrCard = forwardRef<View, { details: ShareQrDetails; onLayoutReady: (height: number) => void }>(function GlacierQrCard({ details, onLayoutReady }, ref) {
  const name = details.ownerName?.trim() || 'My wallet';
  return <View ref={ref} collapsable={false} style={s.canvas} testID="glacier-qr-export" onLayout={event => onLayoutReady(event.nativeEvent.layout.height)}>
    {[false, true].map(right => <View key={String(right)} style={[s.compass, { left: right ? GLACIER_WIDTH - 88 : -12 }]}><Svg width={100} height={100} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="39" stroke={W.shareCard.glacierLine} fill="none" />
      <Circle cx="50" cy="50" r="32" stroke={W.shareCard.glacierLine} fill="none" />
      <Path d="M50 0L56 44L100 50L56 56L50 100L44 56L0 50L44 44Z M15 15L50 43L85 15L57 50L85 85L50 57L15 85L43 50Z" stroke={W.shareCard.glacierLine} fill="none" />
    </Svg></View>)}
    <View style={s.brand}><SociallyEmblem width={46} height={46} /><Text allowFontScaling={false} style={s.wordmark}>SOCIALLY</Text></View>
    <View style={s.paper}>
      <View style={s.avatar}><Text allowFontScaling={false} style={s.initial}>{Array.from(name)[0]?.toLocaleUpperCase()}</Text></View>
      <Text allowFontScaling={false} style={s.name}>{name}</Text>
      <Text allowFontScaling={false} style={s.subtitle}>{details.network.includes('DEVNET') ? 'Solana Devnet wallet' : 'Solana wallet'}</Text>
      <Text allowFontScaling={false} style={s.scan}>Scan to send to my wallet</Text>
      <View style={s.qr}><QRCode value={details.value} size={244} quietZone={16} color={W.receiveQrInk} backgroundColor={W.white} ecl="H"
        logoSVG={qrEmblemSvg} logoSize={32} logoMargin={4} logoBackgroundColor={W.white} logoBorderRadius={20} /></View>
      <Text allowFontScaling={false} style={s.label}>Wallet Address:</Text>
      <Text allowFontScaling={false} style={s.address} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{details.address}</Text>
    </View>
    <Text allowFontScaling={false} style={s.footer}>{details.network.includes('DEVNET') ? 'This address is for Solana Devnet assets only.' : 'This address is for Solana assets only.'}</Text>
  </View>;
});

const s = StyleSheet.create({
  canvas: { width: GLACIER_WIDTH, backgroundColor: W.shareCard.glacier, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 18 },
  compass: { position: 'absolute', top: 2 },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 38 },
  wordmark: { fontFamily: BrandFont.wordmark, fontSize: 28, letterSpacing: 2, color: W.receiveQrInk },
  paper: { alignItems: 'center', borderRadius: 24, backgroundColor: W.white, paddingTop: 39, paddingHorizontal: 10, paddingBottom: 20 },
  avatar: { position: 'absolute', top: -29, width: 62, height: 62, borderRadius: 31, borderWidth: 4, borderColor: W.white, backgroundColor: W.receiveQrInk, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: InterFont.medium, fontSize: 30, lineHeight: 38, color: W.heroPositive },
  name: { fontFamily: BrandFont.editorial, fontSize: 30, lineHeight: 36, color: W.receiveQrInk, textAlign: 'center' },
  subtitle: { fontFamily: InterFont.regular, fontSize: 13, lineHeight: 20, color: W.secondary },
  scan: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 21, color: W.receiveQrInk, marginTop: 16 },
  qr: { marginTop: 2 },
  label: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 16, color: W.secondary, marginTop: 3 },
  address: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 10.5, lineHeight: 18, color: W.receiveQrInk, width: '100%', textAlign: 'center' },
  footer: { fontFamily: InterFont.regular, fontSize: 11, lineHeight: 17, color: W.receiveQrInk, textAlign: 'center', marginTop: 16 },
});
