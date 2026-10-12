import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Eye, EyeOff, Sailboat } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { TradingContext } from '@/api/markets';
import { vaultBuyingPower } from '@/api/market-vault';
import { formatUsdc } from '@/api/wallet';
import { AuthButton } from '@/components/shared/motion';
import { BrandFont, InterFont } from '@/constants/fonts';
import { CaptainMarketsPalette as M } from '@/constants/theme/captain-markets';

export function MarketVaultCard({ context, hidden, canToggle, onToggle, onSelect, onInvested, now, loading = false, error = null }: {
  context: TradingContext | null; hidden: boolean; canToggle: boolean; onToggle: () => void;
  onSelect: () => void; onInvested: () => void; now?: number; loading?: boolean; error?: string | null;
}) {
  const fund = context?.fund, name = fund?.name ?? (loading ? 'Loading your vault…' : error ? 'Vault unavailable' : 'Select your vault');
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);
  const [failedBanner, setFailedBanner] = useState<string | null>(null);
  const avatar = fund?.avatarUrl && fund.avatarUrl !== failedAvatar ? fund.avatarUrl : null;
  const banner = fund?.bannerUrl && fund.bannerUrl !== failedBanner ? fund.bannerUrl : null;
  const cash = vaultBuyingPower(context, now);
  const balance = cash === null ? '—' : hidden ? '••••••' : `${formatUsdc(cash)} USDC`;
  const stacked = balance.length > 18;
  const notice = !context ? loading ? 'Fetching your trading vault' : error ? 'Retry loading your trading vault' : 'Create or select a vault to trade' : fund?.phase === 'FUNDRAISING' ? 'Trading opens after successful fundraising'
    : fund?.status === 'FROZEN' ? 'Buys paused · eligible sells available' : cash === null ? 'Trading is closed'
    : context.pending.length ? `${context.pending.length} pending ${context.pending.length === 1 ? 'order' : 'orders'}` : null;
  return <View style={s.card} testID="market-vault-card">
    <AuthButton accessibilityRole="button" accessibilityLabel={`Select trading vault, ${name}`} onPress={onSelect} style={s.cover} testID="market-vault-cover-select">
      <LinearGradient colors={M.marketGlass} style={StyleSheet.absoluteFill} />
      <Image source={require('../../../assets/images/discover/vault-harbor.webp')} contentFit="cover" style={StyleSheet.absoluteFill} accessible={false} testID="market-vault-default-banner" />
      {banner ? <Image key={`${fund?.id}:${banner}`} source={{ uri: banner }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={`${fund?.id}:${banner}`} onError={() => setFailedBanner(banner)} style={StyleSheet.absoluteFill} accessible={false} testID="market-vault-banner" /> : null}
    </AuthButton>
    <View style={s.body}>
      <View style={s.avatar} testID="market-vault-avatar">
        <Text style={s.initial} accessible={false}>{fund?.name.trim().slice(0, 1).toUpperCase() || 'V'}</Text>
        {avatar ? <Image key={`${fund?.id}:${avatar}`} source={{ uri: avatar }} contentFit="cover" cachePolicy="memory-disk" recyclingKey={`${fund?.id}:${avatar}`} onError={() => setFailedAvatar(avatar)} style={StyleSheet.absoluteFill} accessible={false} testID="market-vault-avatar-image" /> : null}
      </View>
      <View style={s.details}>
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
  cover: { height: 120, overflow: 'hidden' },
  body: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  avatar: { position: 'absolute', left: 16, top: -43, width: 60, height: 60, borderRadius: 19, borderCurve: 'continuous', borderWidth: 2, borderColor: '#FCFEFF', backgroundColor: M.ink, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: BrandFont.editorial, color: '#FFFFFF', fontSize: 42, lineHeight: 50 },
  details: { gap: 8 },
  stackedReserve: { flexDirection: 'column', alignItems: 'stretch', gap: 2, paddingVertical: 8 },
  stackedBalance: { textAlign: 'left', flex: 0, fontSize: 16 },
  largeBalance: { fontSize: 12 },
  identity: { minWidth: 0, alignItems: 'flex-start' },
  selector: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, maxWidth: '100%' },
  name: { fontFamily: BrandFont.editorial, color: M.ink, fontSize: 30, lineHeight: 34, flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, backgroundColor: M.tokenTile },
  badgeText: { fontFamily: InterFont.medium, color: M.secondary, fontSize: 12, lineHeight: 16 },
  reserve: { minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: M.line, marginTop: 2 },
  label: { fontFamily: InterFont.regular, fontSize: 12, lineHeight: 18, color: M.secondary },
  balance: { flex: 1, minWidth: 0, fontFamily: InterFont.semiBold, fontSize: 20, lineHeight: 28, color: M.ink, fontVariant: ['tabular-nums'], textAlign: 'right' },
  notice: { fontFamily: InterFont.regular, color: M.secondary, fontSize: 10, lineHeight: 16, marginTop: 10 },
  visibility: { position: 'absolute', top: 8, right: 8, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(248,252,255,0.9)', alignItems: 'center', justifyContent: 'center' },
});
