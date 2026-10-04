import { useAccountSettings } from '@/components/settings/settings-provider';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { selectionFeedback } from '@/components/shared/feedback';
import { FundVaultIcon, ReserveIcon } from '@/components/shared/icons/product-icons';
import { TokenIcon } from '@/components/shared/markets/market-graphics';
import { AuthButton } from '@/components/shared/motion';
import { discoverCaptains, type DiscoverCaptain } from '@/constants/discover';
import { DiscoverPalette as D } from '@/constants/theme';
import { formatWalletValue, walletAssets } from '@/constants/wallet';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight, ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InvestmentCaptainSummary, InvestmentHero } from './captain-investment-header';
import { CaptainAvatar } from './discover-ui';
import { investmentStyles as S } from './captain-investment-styles';
import { amountInCents, estimateShares, formatInvestmentAmount, investmentError, investmentPresets, PREVIEW_SHARE_PRICE } from './investment-model';

export default function CaptainInvestmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const captain = discoverCaptains.find(item => item.id === id);
  if (!captain) return <View style={S.root}><View style={S.missing}><Text style={S.title}>Captain not found</Text><Text style={S.body}>Choose a Captain from Discover to preview an investment.</Text><AuthButton accessibilityRole="button" onPress={() => router.replace('/explore')} style={S.cta}><Text style={S.ctaText}>Back to Discover</Text></AuthButton></View></View>;
  return <CaptainInvestment key={captain.id} captain={captain} />;
}

function CaptainInvestment({ captain }: { captain: DiscoverCaptain }) {
  const insets = useSafeAreaInsets();
  const { settings } = useAccountSettings();
  const [amount, setAmount] = useState('500');
  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sheet, setSheet] = useState<'review' | 'shares' | null>(null);
  // Use the same preview funds as Wallet; this does not represent a live balance.
  const balance = walletAssets.find(asset => asset.symbol === 'USDC')?.value ?? 0;
  const balanceCents = Math.round(balance * 100);
  const cents = amountInCents(amount);
  const error = investmentError(amount, balanceCents);
  const shares = cents !== null && cents > 0 && !error ? estimateShares(cents).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
  const displayAmount = cents !== null && cents > 0 ? formatInvestmentAmount(cents) : '0';
  function back() {
    Keyboard.dismiss();
    if (router.canGoBack()) router.back(); else router.replace({ pathname: '/captain/[id]', params: { id: captain.id } });
  }
  function preset(value: number) { selectionFeedback(); setAmount(String(value)); }
  function review() { if (error) return; Keyboard.dismiss(); selectionFeedback(); setSheet('review'); }

  return <KeyboardAvoidingView style={S.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} testID="captain-investment-screen">
    <StatusBar style="dark" />
    <ScrollView style={S.scroll} contentContainerStyle={S.content} keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      testID="investment-scroll" showsVerticalScrollIndicator={false}>
      <InvestmentHero captain={captain} topInset={insets.top} onBack={back} />
      <View style={S.sections}>
        <InvestmentCaptainSummary captain={captain} />
        <View style={S.card} testID="investment-form">
          <View style={S.between}><Text style={S.title}>Your investment</Text><Text style={S.balance} testID="investment-balance">Sample balance{ '\n' }{settings.hideBalances ? '•••• USDC' : `${formatInvestmentAmount(balanceCents)} USDC`}</Text></View>
          <View style={[S.amountBox, focused && S.focused, error && S.invalid]}>
            <View style={S.token}><TokenIcon symbol="USDC" size={28} /><Text style={S.tokenName}>USDC</Text></View>
            <View style={S.flex}>
              <TextInput accessibilityLabel="Investment amount in USDC" accessibilityHint="Enter up to two decimal places"
                testID="investment-amount" value={amount} onChangeText={setAmount} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                inputMode="decimal" keyboardType="decimal-pad" autoCorrect={false} autoComplete="off" maxLength={16}
                returnKeyType="done" submitBehavior="blurAndSubmit" onSubmitEditing={Keyboard.dismiss}
                selectionColor={D.accent} underlineColorAndroid="transparent" placeholder="0" placeholderTextColor={D.muted}
                style={[S.amountInput, amount.length > 7 && { fontSize: 22 }]} />
              <Text style={S.equivalent}>{cents !== null ? `≈ ${formatWalletValue(cents / 100)}` : 'Enter a USDC amount'}</Text>
            </View>
          </View>
          <View style={S.presets}>{[...investmentPresets, 'Max' as const].map(value => {
            const selected = cents === (value === 'Max' ? balanceCents : value * 100);
            return <AuthButton key={value} accessibilityRole="button" accessibilityLabel={value === 'Max' ? 'Use maximum sample USDC balance' : `Invest ${value} USDC`}
              accessibilityState={{ selected }} aria-pressed={selected} style={[S.preset, selected && S.activePreset]} onPress={() => preset(value === 'Max' ? balanceCents / 100 : value)} testID={`investment-preset-${value}`}>
              <Text style={[S.presetText, selected && S.activePresetText]}>{value === 'Max' ? value : `$${value.toLocaleString('en-US')}`}</Text>
            </AuthButton>;
          })}</View>
          {error && <Text style={S.error} accessibilityLiveRegion="polite" testID="investment-error">{error}</Text>}
          <View style={S.shares}>
            <View style={S.between}><View style={S.row}><ReserveIcon size={21} color={D.risk} /><Text style={S.stepTitle}>Estimated shares</Text></View><AuthButton style={S.info} onPress={() => { Keyboard.dismiss(); setSheet('shares'); }} accessibilityRole="button" accessibilityLabel="How estimated shares are calculated"><Info size={17} color={D.secondary} /></AuthButton></View>
            <Text style={S.shareValue} testID="investment-shares">{shares === '—' ? shares : `≈ ${shares} shares`}</Text>
            <Text style={S.caption}>Your proportional ownership in {captain.name}’s fund. Estimate uses an illustrative share price.</Text>
          </View>
          <View style={S.detailRow}><Text style={S.caption}>Performance fee</Text><Text style={S.detailValue}>{captain.fee}% of eligible profits</Text></View>
          <View style={S.detailRow}><Text style={S.caption}>Strategy risk</Text><Text style={S.detailValue}>{captain.risk}</Text></View>
        </View>
        <View style={S.card}>
          <AuthButton style={S.disclosure} accessibilityRole="button" accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => { selectionFeedback(); setExpanded(value => !value); }} testID="investment-how-it-works">
            <FundVaultIcon size={22} color={D.risk} /><Text style={[S.title, S.flex]}>How it works</Text>{expanded ? <ChevronUp size={18} color={D.secondary} /> : <ChevronDown size={18} color={D.secondary} />}
          </AuthButton>
          {expanded && <View style={S.steps} testID="investment-steps">{[
            ['Deposit into the fund', 'USDC goes to a program-controlled vault on Solana. The Captain’s intended permission is to trade within the fund.'],
            ['Receive fund shares', 'Shares represent your portion of the portfolio, rather than a separate copy of each trade.'],
            ['Follow the performance', 'Your share value can rise or fall. Exits may require a queue when positions cannot be sold immediately.'],
          ].map(([title, copy], index) => <View key={title} style={S.step}><View style={S.stepNumber}><Text style={S.stepNumberText}>{index + 1}</Text></View><View style={S.flex}><Text style={S.stepTitle}>{title}</Text><Text style={S.body}>{copy}</Text></View></View>)}</View>}
          <Text style={S.caption}>Investments can lose value. Sample returns do not predict future performance.</Text>
        </View>
      </View>
    </ScrollView>
    <View style={[S.footer, { paddingBottom: Math.max(insets.bottom, 12) }]} testID="investment-footer">
      <View style={S.footerInner}><AuthButton accessibilityRole="button" accessibilityState={{ disabled: Boolean(error) }} aria-disabled={Boolean(error)} disabled={Boolean(error)} onPress={review} style={[S.cta, error && S.disabled]} testID="investment-review">
        <Text style={S.ctaText}>{error ? 'Enter a valid amount' : `Review $${displayAmount} USDC`}</Text><ArrowRight size={18} color={D.heroInk} />
      </AuthButton><Text style={S.footerCaption}>Investment preview · No funds move</Text></View>
    </View>
    <DashboardSheet visible={sheet !== null} onClose={() => setSheet(null)} title={sheet === 'shares' ? 'Understanding fund shares' : 'Review investment'}
      footer={<AuthButton accessibilityRole="button" style={S.cta} onPress={() => setSheet(null)} testID="investment-review-close"><Text style={S.ctaText}>{sheet === 'shares' ? 'Got it' : 'Back to amount'}</Text></AuthButton>}>
      {sheet === 'shares' ? <View style={S.review}><ReserveIcon color={D.risk} size={30} /><Text style={S.body}>Fund shares represent proportional ownership. The share price comes from the fund’s net asset value divided by its outstanding shares.</Text><View style={S.reviewNotice}><Text style={S.title}>Illustrative share price</Text><Text style={S.body}>1 share = {PREVIEW_SHARE_PRICE} USDC</Text><Text style={S.caption}>This preview divides your USDC amount by that sample price. A live estimate will need current fund values and any applicable costs.</Text></View></View>
        : <View style={S.review} testID="investment-review-summary"><View style={S.row}><CaptainAvatar captain={captain} /><View style={S.flex}><Text style={S.title}>{captain.name}</Text><Text style={S.body}>{captain.fund}</Text></View></View><Text style={S.reviewAmount}>${displayAmount}</Text><Text style={[S.caption, { textAlign: 'center' }]}>USDC on Solana</Text><View style={S.divider} /><ReviewRow label="Estimated shares" value={shares} /><ReviewRow label="Sample balance after" value={settings.hideBalances ? '•••• USDC' : `${formatInvestmentAmount(Math.max(0, balanceCents - (cents ?? 0)))} USDC`} /><ReviewRow label="Performance fee" value={`${captain.fee}% of eligible profits`} /><ReviewRow label="Strategy risk" value={captain.risk} /><View style={S.reviewNotice}><Text style={S.title}>You’re exploring a preview</Text><Text style={S.body}>Live deposits aren’t available yet. Your wallet is not charged and no fund shares are issued.</Text></View></View>}
    </DashboardSheet>
  </KeyboardAvoidingView>;
}

function ReviewRow({ label, value }: { label: string; value: string }) { return <View style={S.detailRow}><Text style={S.body}>{label}</Text><Text style={S.detailValue}>{value}</Text></View>; }
