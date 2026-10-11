import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Compass, Eye, EyeOff, Sailboat } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TradingContext } from '@/api/markets';
import { vaultBuyingPower } from '@/api/market-vault';
import { formatUsdc } from '@/api/wallet';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';

export function MarketVaultCard({ context, hidden, canToggle, onToggle, onSelect, onInvested, now }: {
  context: TradingContext | null; hidden: boolean; canToggle: boolean; onToggle: () => void;
  onSelect: () => void; onInvested: () => void; now?: number;
}) {
  const fund = context?.fund, name = fund?.name ?? 'Select your vault';
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const avatar = fund?.avatarUrl && fund.avatarUrl !== failedAvatar ? fund.avatarUrl : null;
  const banner = fund?.bannerUrl && fund.bannerUrl !== failedBanner ? fund.bannerUrl : null;
  const cash = vaultBuyingPower(context, now);
  const balance = cash === null ? '—' : hidden ? '••••••' : `${formatUsdc(cash)} USDC`;
  const stacked = name.length > 24 || balance.length > 18;
  const notice = !context ? 'Create or select a vault to trade' : fund?.phase === 'FUNDRAISING' ? 'Trading opens after successful fundraising'
    : fund?.status === 'FROZEN' ? 'Buys paused · eligible sells available' : cash === null ? 'Trading is closed'
    : context.pending.length ? `${context.pending.length} pending ${context.pending.length === 1 ? 'order' : 'orders'}` : null;
  return <View style={s.card} testID="market-vault-card">
    <AuthButton accessibilityRole="button" accessibilityLabel={`Select trading vault, ${name}`} onPress={onSelect} style={s.cover} testID="market-vault-cover-select">
      <LinearGradient colors={M.marketGlass} style={StyleSheet.absoluteFill} />
      <Compass size={46} color={M.sail} style={s.coverCompass} aria-hidden />
      {banner ? <Image key={`${fund?.id}:${banner}`} source={{ uri: banner }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={`${fund?.id}:${banner}`} onError={() => setFailedBanner(banner)} style={StyleSheet.absoluteFill} accessible={false} testID="market-vault-banner" /> : null}
    </AuthButton>
    <View style={s.body}>
      <View style={s.avatar} testID="market-vault-avatar">
        <Text style={s.initial} accessible={false}>{fund?.name.trim().slice(0, 1).toUpperCase() || 'V'}</Text>
        {avatar ? <Image key={`${fund?.id}:${avatar}`} source={{ uri: avatar }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={`${fund?.id}:${avatar}`} onError={() => setFailedAvatar(avatar)} style={StyleSheet.absoluteFill} accessible={false} testID="market-vault-avatar-image" /> : null}
      </View>
      <View style={[s.details, stacked && s.stackedDetails]}>
        <View style={s.identity}>
          <AuthButton accessibilityRole="button" accessibilityLabel={`Select trading vault, ${name}`} testID="market-vault-select" onPress={onSelect} style={s.selector}>
            <Text numberOfLines={2} style={s.name}>{name}</Text><ChevronDown size={17} color={M.secondary} />
          </AuthButton>
          <View style={s.badge}><Sailboat size={13} color={M.secondary} aria-hidden /><Text style={s.badgeText}>Paper trading</Text></View>
        </View>
        <AuthButton accessibilityRole="button" accessibilityLabel="View invested markets" accessibilityHint="Opens the selected vault’s positions" onPress={onInvested} disabled={!context} style={[s.reserve, stacked && s.stackedReserve]} testID="market-vault-invested">
          <Text style={s.label}>Buying power</Text>
          <Text testID="market-available-balance" style={[s.balance, stacked && s.stackedBalance, balance.length > 28 && s.largeBalance]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{balance}</Text>
        </AuthButton>
      </View>
      {notice ? <Text style={s.notice} testID="market-vault-notice">{notice}</Text> : null}
    </View>
    <AuthButton accessibilityRole="button" accessibilityLabel={hidden ? 'Show vault balances' : 'Hide vault balances'} testID="market-balance-visibility" disabled={!canToggle} onPress={onToggle} style={s.visibility}>{hidden ? <EyeOff size={18} color={M.ink} /> : <Eye size={18} color={M.ink} />}</AuthButton>
  </View>;
}

const s = StyleSheet.create({
  card: { borderRadius: 24, borderCurve: 'continuous', backgroundColor: '#FCFEFF', borderWidth: 1, borderColor: M.border, overflow: 'hidden', boxShadow: M.shadow },
  cover: { height: 104, overflow: 'hidden' },
  coverCompass: { position: 'absolute', right: 62, top: 29 },
  body: { paddingHorizontal: 14, paddingTop: 31, paddingBottom: 14 },
  avatar: { position: 'absolute', left: 14, top: -25, width: 56, height: 56, borderRadius: 18, borderCurve: 'continuous', borderWidth: 3, borderColor: '#FCFEFF', backgroundColor: M.ink, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: BrandFont.editorial, color: '#FFFFFF', fontSize: 37, lineHeight: 44 },
  details: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stackedDetails: { flexDirection: 'column', alignItems: 'stretch' },
  stackedReserve: { flex: 0, alignItems: 'flex-start', marginTop: 6 },
  stackedBalance: { textAlign: 'left' },
  largeBalance: { fontSize: 11 },
  identity: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, width: '100%' },
  name: { fontFamily: BrandFont.editorial, color: M.ink, fontSize: 24, lineHeight: 25, flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14, backgroundColor: M.tokenTile },
  badgeText: { fontFamily: InterFont.medium, color: M.secondary, fontSize: 10, lineHeight: 14 },
  reserve: { flex: 1, minWidth: 0, minHeight: 48, justifyContent: 'center', alignItems: 'flex-end' },
  label: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 16, color: M.secondary },
  balance: { fontFamily: InterFont.semiBold, fontSize: 17, lineHeight: 26, color: M.ink, fontVariant: ['tabular-nums'], textAlign: 'right', width: '100%' },
  notice: { fontFamily: InterFont.regular, color: M.secondary, fontSize: 10, lineHeight: 16, marginTop: 10 },
  visibility: { position: 'absolute', top: 8, right: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(248,252,255,0.9)', alignItems: 'center', justifyContent: 'center' },
});
