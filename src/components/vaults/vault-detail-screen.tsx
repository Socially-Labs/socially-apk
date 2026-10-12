import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Delete, FileText, LockKeyhole, MoreHorizontal, Users, X } from 'lucide-react-native';
import type { VaultOperation, VaultSummary } from '@/api/vaults';
import { formatUsdc } from '@/api/wallet';
import { useVaults } from '@/hooks/use-vaults';
import { useVaultIntent } from '@/hooks/use-vault-intent';
import { useAccountSettings } from '@/components/settings/settings-provider';
import { ProfileMediaImage } from '@/components/settings/profile-media-image';
import { profileFallback } from '@/components/settings/profile-fallbacks';
import { DiscoveryBanner } from '@/components/discover/crew-discovery-media';
import { DashboardSheet } from '@/components/shared/dashboard/dashboard-sheet';
import { SailingRefresh } from '@/components/shared/refresh/sailing-refresh';
import { ShipLoader } from '@/components/shared/refresh/ship-loader';
import { SwapSlideControl } from '@/components/wallet/swap-slide-control';
import { DiscoverPalette as C } from '@/constants/theme';
import { PaperBalanceSetup } from './paper-balance-setup';
import { RoundTerms } from './vault-round-terms';
import { VaultArtwork } from './vault-artwork';
import { delegationError, delegationLimit, usdcDecimal, usdcUnits } from './delegation-amount';
import { vaultDetailStyles as s } from './vault-detail-styles';

type Sheet = 'amount' | 'review' | 'success' | 'details' | null;
type Review = { amount: string; available: string; termsHash: string; quotedAt: number };
const noop = () => {};
const phaseLabel = { FUNDRAISING: 'Funding', ACTIVE: 'Active', SETTLING: 'Settling', COMPLETED: 'Completed', REFUNDING: 'Refunding', CANCELLED: 'Cancelled' };
function Button({ children, onPress, disabled = false, secondary = false, testID }: { children: ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean; testID?: string }) {
  return <Pressable testID={testID} accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary && s.secondary, (pressed || disabled) && s.dim]}>
    <Text style={[s.buttonText, secondary && s.secondaryText]}>{children}</Text>
  </Pressable>;
}
function Row({ icon, label, value, onPress }: { icon?: ReactNode; label: string; value?: string; onPress?: () => void }) {
  const content = <>{icon ? <View style={s.well}>{icon}</View> : null}<Text style={s.rowTitle}>{label}</Text>{value ? <Text style={s.value}>{value}</Text> : null}{onPress ? <ChevronRight size={18} color={C.secondary} /> : null}</>;
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>{content}</Pressable> : <View style={s.row}>{content}</View>;
}
function Photo({ vault, small = false }: { vault: VaultSummary; small?: boolean }) {
  return <View style={small ? s.smallPhoto : s.photo}><ProfileMediaImage kind="avatar" uri={vault.avatarUrl} fallbackId={profileFallback(vault.id).id} /></View>;
}
function Identity({ vault }: { vault: VaultSummary }) {
  return <View style={s.sheetIdentity}><Photo vault={vault} small /><View style={{ flex: 1 }}><Text style={s.cardTitle} numberOfLines={2}>{vault.name}</Text><Text style={s.caption}>Vault delegation</Text></View></View>;
}
function ErrorMessage({ value }: { value: string | null }) { return value ? <Text accessibilityRole="alert" style={s.error}>{value}</Text> : null; }

export function VaultDetailScreen() {
  const { id: param } = useLocalSearchParams<{ id: string }>();
  const id = typeof param === 'string' ? param : '';
  const data = useVaults(id);
  // Remount private composer/receipt state synchronously on account or vault change.
  return <VaultDetail key={`${data.subject}:${id}`} id={id} data={data} />;
}

function VaultDetail({ id, data }: { id: string; data: ReturnType<typeof useVaults> }) {
  const { vault, position } = data;
  const insets = useSafeAreaInsets();
  const { settings, ready } = useAccountSettings();
  const hidden = !ready || settings.hideBalances;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [amount, setAmount] = useState('50');
  const [review, setReview] = useState<Review | null>(null);
  const [receipt, setReceipt] = useState<VaultOperation | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [now, setNow] = useState(Date.now);
  const [focused, setFocused] = useState(false);
  const quoteRequest = useRef<AbortController | null>(null);
  const quoteLocked = useRef(false);
  const intent = useVaultIntent(data.api, data.subject, `vault:${id}`, (_vaultId, operation) => {
    if (operation.kind === 'CONTRIBUTE') { setReceipt(operation); setSheet('success'); }
    else setSheet(null);
    setReview(null); setLocalError(null); data.refresh();
  });
  useEffect(() => () => { quoteRequest.current?.abort(); }, []);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { setFocused(false); quoteRequest.current?.abort(); quoteLocked.current = false; setQuoting(false); clearInterval(timer); };
  }, []));
  const money = (value: string | null | undefined, exact = false) => {
    if (hidden) return '••••';
    if (value == null) return '—';
    if (!exact) return `${formatUsdc(value)} USDC`;
    const [whole, fraction = ''] = value.split('.');
    const decimals = fraction.replace(/0+$/, '').padEnd(2, '0');
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimals} USDC`;
  };
  const fresh = !!data.refreshedAt && now - data.refreshedAt < 90_000 && !data.error && !data.privateError;
  const serverNow = vault ? Date.parse(vault.serverTime) + (data.refreshedAt ? now - data.refreshedAt : 0) : 0;
  const funding = !!vault && vault.phase === 'FUNDRAISING' && serverNow < Date.parse(vault.fundingClosesAt);
  const saved = intent.attempt?.intent;
  const contributionSaved = saved?.kind === 'CONTRIBUTE' ? saved : null;
  const canAct = focused && !vault?.isDemo && intent.ready && !intent.busy && fresh;
  const eligible = funding && vault?.riskState === 'NORMAL' && !!position && !position.isCaptain && (data.config?.enabled ?? false);
  const validation = position && vault ? delegationError(amount, position.availableUsdc, vault.remainingCapacityUsdc, data.config?.minimumCrewDepositUsdc) : 'Available balance is loading.';
  const reviewValid = !!review && fresh && funding && eligible && review.termsHash === vault?.termsHash && now - review.quotedAt < 90_000
    && !!position && !delegationError(review.amount, position.availableUsdc, vault!.remainingCapacityUsdc, data.config?.minimumCrewDepositUsdc);
  const close = () => {
    if (intent.busy || quoting) return;
    quoteRequest.current?.abort(); setSheet(null); setLocalError(null);
  };
  const activity = () => { close(); router.push('/paper-activity'); };
  const openComposer = () => {
    setLocalError(null); setReview(null); setSheet(contributionSaved ? 'review' : 'amount');
  };
  const changeAmount = (value: string) => { if (!quoting && !saved) { setAmount(value); setLocalError(null); setReview(null); } };
  const quote = async () => {
    if (!vault || !position || !canAct || !eligible || saved || quoteLocked.current) return;
    if (validation) { setLocalError(validation); return; }
    quoteLocked.current = true; setQuoting(true); setLocalError(null);
    const controller = new AbortController(); quoteRequest.current?.abort(); quoteRequest.current = controller;
    try {
      const result = await data.api.quote(id, { amountUsdc: amount, termsHash: vault.termsHash }, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.allowed) throw new Error(result.reason === 'capacity_exceeded' ? 'The vault’s remaining capacity changed. Review your amount.' : 'Delegation is unavailable. Refresh and try again.');
      setReview({ amount: result.amountUsdc, available: position.availableUsdc, termsHash: vault.termsHash, quotedAt: Date.now() });
      Keyboard.dismiss(); setSheet('review');
    } catch (error) {
      if (!controller.signal.aborted) { setLocalError(error instanceof Error ? error.message : 'Could not review delegation.'); data.refresh(); }
    } finally { quoteLocked.current = false; if (!controller.signal.aborted) setQuoting(false); }
  };
  const confirm = async () => {
    // Saved operations always use their original body/key, even after funding ends.
    if (contributionSaved) { if (intent.ready) await intent.submit(contributionSaved); return; }
    if (!canAct || !reviewValid || !review) { setLocalError('Vault values changed. Edit the amount and review again.'); return; }
    await intent.submit({ kind: 'CONTRIBUTE', vaultId: id, body: { amountUsdc: review.amount, termsHash: review.termsHash } });
  };
  const submitOther = async (kind: 'CLAIM' | 'CANCEL') => {
    if (!canAct || saved) return;
    await intent.submit({ kind, vaultId: id, body: {} });
  };
  const reviewAmount = contributionSaved?.body.amountUsdc ?? review?.amount ?? amount;
  const available = review?.amount === reviewAmount ? review.available : null;
  const after = available && usdcUnits(available) !== null && usdcUnits(reviewAmount) !== null
    ? usdcDecimal(usdcUnits(available)! - usdcUnits(reviewAmount)!) : null;
  const accepted = vault ? usdcUnits(vault.acceptedCapitalUsdc) ?? 0n : 0n;
  const capacity = accepted + (vault ? usdcUnits(vault.remainingCapacityUsdc) ?? 0n : 0n);
  const percent = capacity > 0n ? Number(accepted * 10_000n / capacity) / 100 : 0;
  const closes = vault ? Math.max(0, Date.parse(vault.fundingClosesAt) - serverNow) : 0;
  const countdown = closes >= 86_400_000 ? `${Math.ceil(closes / 86_400_000)}d` : closes >= 3_600_000 ? `${Math.ceil(closes / 3_600_000)}h` : closes > 0 ? `${Math.ceil(closes / 60_000)}m` : 'Closed';
  const status = vault ? phaseLabel[vault.phase] : '';
  const mainLabel = contributionSaved ? 'Check delegation' : vault?.isDemo ? 'Preview vault' : position?.isCaptain ? 'Manage vault' : !data.subject ? 'Sign in to delegate' : !funding ? status || 'Unavailable' : 'Delegate';
  const mainDisabled = !vault || intent.busy || (!contributionSaved && !!data.subject && !position) || (!contributionSaved && !vault.isDemo && !position?.isCaptain && !!data.subject && (!eligible || !canAct));

  return <View style={[s.root, { paddingTop: insets.top }]} testID="vault-detail">
    <View style={s.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" style={s.iconButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/explore')}><ArrowLeft size={22} color={C.ink} /></Pressable>
      <Text style={s.navTitle}>Vault</Text><Pressable accessibilityRole="button" accessibilityLabel="Vault details" style={s.iconButton} onPress={() => setSheet('details')}><MoreHorizontal size={22} color={C.ink} /></Pressable></View>
    <SailingRefresh refreshing={data.loading} onRefresh={data.refresh} enabled={!sheet}>{scrollProps => <ScrollView {...scrollProps} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {data.loading && !vault ? <ShipLoader label="Loading vault…" /> : null}
      <ErrorMessage value={data.error} /><ErrorMessage value={data.privateError} />
      {data.error || data.privateError ? <Button secondary onPress={data.refresh}>Retry loading vault</Button> : null}
      {vault ? <>
        <View style={s.banner}><DiscoveryBanner uri={vault.bannerUrl} identity={vault.id} height={116} /></View>
        <View style={s.profile}><Photo vault={vault} /><View style={s.identity}><Text style={s.title}>{vault.name}</Text><Pressable accessibilityRole="button" accessibilityLabel="View Captain profile" onPress={() => router.push({ pathname: '/captain/[id]', params: { id: vault.captainId } })}><View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Text style={s.caption}>View Captain</Text><ArrowRight size={12} color={C.secondary} /></View></Pressable>
          <View style={[s.status, funding && { backgroundColor: '#DFF9EF' }]}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: funding ? C.positive : C.secondary }} /><Text style={[s.statusText, funding && { color: C.positive }]}>{status}</Text></View>
        </View></View>
        <View style={s.card} testID="vault-funding-summary"><View style={s.between}><Text style={s.label}>{vault.phase === 'FUNDRAISING' ? 'Funded' : 'Accepted funding'}</Text><Text style={s.caption}>Target {money(usdcDecimal(capacity))}</Text></View>
          <Text style={s.big} adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.7}>{money(vault.acceptedCapitalUsdc)}</Text>
          <View accessibilityRole="progressbar" accessibilityLabel="Vault funding" accessibilityValue={{ min: 0, max: 100, now: hidden ? undefined : percent, text: hidden ? 'Balance hidden' : `${percent}% funded` }} style={s.track}><View style={[s.fill, { width: `${hidden ? 0 : Math.min(100, percent)}%` }]} /></View>
          <View style={s.between}><Text style={s.value}>{hidden ? '••••' : `${Math.round(percent)}%`}</Text><Text style={s.caption}>{money(vault.remainingCapacityUsdc)} left</Text></View>
        </View>
        <View style={[s.card, { gap: 0, paddingVertical: 4 }]}>
          <Row icon={<CalendarDays size={21} color={C.ink} />} label="Duration" value={`${vault.durationDays} days`} /><View style={s.line} />
          <Row icon={<Users size={21} color={C.ink} />} label="Members" value={String(vault.participants)} /><View style={s.line} />
          <Row icon={<Clock3 size={21} color={C.ink} />} label={funding ? 'Closes in' : 'Funding'} value={countdown} /><View style={s.line} />
          <Row icon={<FileText size={21} color={C.ink} />} label="Activity" onPress={activity} />
        </View>
        {vault.isDemo ? <Text style={s.caption}>Preview · Delegation unavailable</Text> : null}
        {saved && !contributionSaved ? <Button secondary onPress={() => setSheet('details')}>Check saved request</Button> : null}
        {data.config?.walletSnapshotEnabled && funding && position && !position.isCaptain && position.availableUsdc === '0.000000' ? <PaperBalanceSetup onReady={data.refresh} /> : null}
      </> : !data.loading && !data.error ? <Text style={s.body}>This vault is unavailable.</Text> : null}
    </ScrollView>}</SailingRefresh>
    <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}><Button testID="vault-delegate" disabled={mainDisabled} onPress={() => {
      if (!data.subject) router.push('/');
      else if (vault?.isDemo || position?.isCaptain) setSheet('details');
      else openComposer();
    }}>{mainLabel}</Button></View>
    {vault ? <DashboardSheet visible={sheet !== null} dismissible={!intent.busy && !quoting} title={sheet === 'amount' ? 'Delegate' : sheet === 'success' ? 'Delegated' : sheet === 'details' ? 'Vault details' : 'Review'} onClose={close}
      header={<View style={s.sheetHeading}><Text style={s.cardTitle}>{sheet === 'amount' ? 'Delegate' : sheet === 'success' ? 'Delegated' : sheet === 'details' ? 'Vault details' : 'Review'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close delegation details" disabled={intent.busy || quoting} onPress={close} style={s.iconButton}><X size={20} color={C.secondary} /></Pressable></View>}
      footer={sheet === 'amount' ? <Button testID="delegate-review" disabled={!canAct || !!validation || quoting || !eligible} onPress={() => { void quote(); }}>{quoting ? 'Reviewing…' : 'Review'}</Button>
        : sheet === 'review' ? <SwapSlideControl label={contributionSaved ? 'Slide to check request' : 'Slide to confirm'} pendingLabel="Confirming…" testIDPrefix="delegate" disabled={!intent.ready || intent.busy || (!contributionSaved && (!canAct || !reviewValid))} onCommit={confirm} onDragChange={noop} />
          : sheet === 'success' ? <View style={{ gap: 10 }}><Button onPress={close}>Back to vault</Button><Button secondary onPress={activity}>View activity</Button></View> : <Button onPress={close}>Done</Button>}>
      <View style={s.sheetBody}>
        {sheet !== 'success' ? <Identity vault={vault} /> : null}
        <ErrorMessage value={localError} /><ErrorMessage value={intent.error} />
        {sheet === 'amount' ? <>
          <View style={{ gap: 10 }}><Text style={s.label}>Amount</Text><View style={s.inputBox}><Text style={[s.value, { color: '#3284D5' }]}>$</Text><TextInput testID="delegate-amount" accessibilityLabel="Delegation amount in USDC" value={amount} onChangeText={changeAmount} keyboardType="decimal-pad" showSoftInputOnFocus={false} returnKeyType="done" onSubmitEditing={() => { void quote(); }} maxLength={31} editable={!quoting} style={s.input} /><Text style={s.label}>USDC</Text></View>
            <View style={s.between}><Text style={s.caption}>Available {money(position?.availableUsdc)}</Text><Text style={s.caption}>Min {money(data.config?.minimumCrewDepositUsdc ?? '50.000000')}</Text></View>
            <View style={s.shortcuts}>{['100', '250', '500', 'Max'].map(value => {
              const next = value === 'Max' ? delegationLimit(position?.availableUsdc ?? '0', vault.remainingCapacityUsdc) : value;
              return <Pressable key={value} accessibilityRole="button" accessibilityLabel={value === 'Max' ? 'Use maximum available amount' : `Delegate ${value} USDC`} disabled={quoting} onPress={() => changeAmount(next)} style={[s.shortcut, usdcUnits(next) === usdcUnits(amount) && s.selected]}><Text style={s.shortcutText}>{value}</Text></Pressable>;
            })}</View><ErrorMessage value={validation} />
          </View>
          <View style={{ gap: 8 }}>{[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', 'delete']].map((row, index) => <View key={index} style={s.keyRow}>{row.map(key => <Pressable key={key} accessibilityRole="button" accessibilityLabel={key === 'delete' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key} disabled={quoting} style={s.key} onPress={() => {
            if (key === 'delete') changeAmount(amount.slice(0, -1));
            else if (key === '.') { if (!amount.includes('.')) changeAmount(`${amount || '0'}.`); }
            else if (amount.length < 31) changeAmount(amount === '0' ? key : amount + key);
          }}>{key === 'delete' ? <Delete size={21} color={C.ink} /> : <Text style={s.keyText}>{key}</Text>}</Pressable>)}</View>)}</View>
        </> : null}
        {sheet === 'review' ? <>
          <View style={s.card}><Text style={[s.big, { fontSize: 28 }]}>{money(reviewAmount, true)}</Text><Text style={s.caption}>to {vault.name}</Text><View style={s.line} />
            {available ? <Row label="Source balance" value={money(available, true)} /> : null}{after ? <Row label="Balance after" value={money(after, true)} /> : null}
          </View>
          <View style={s.lock}><LockKeyhole size={22} color={C.ink} /><View style={{ flex: 1 }}><Text style={s.body}>Locked after funding closes</Text><Text style={s.caption}>{vault.durationDays}-day round · Until settlement</Text></View></View>
          {contributionSaved ? <Text style={s.caption}>Checking your original request. The amount is saved.</Text> : <>
            {!reviewValid ? <Text style={s.error}>Vault values changed or review expired. Review the amount again.</Text> : null}
            <Button secondary disabled={intent.busy} onPress={() => { setReview(null); setLocalError(null); setSheet('amount'); }}>Edit amount</Button>
          </>}
          {intent.busy ? <View accessibilityRole="progressbar" accessibilityLabel="Confirming delegation" style={s.sheetIdentity}><ActivityIndicator color={C.ink} /><Text style={s.label}>Confirming…</Text></View> : null}
        </> : null}
        {sheet === 'success' && receipt ? <>
          <View style={s.success} accessibilityLiveRegion="polite"><View style={s.check}><Check size={34} color={C.positive} /></View><Text style={s.title}>Delegated</Text><Text style={[s.big, { fontSize: 28 }]}>{money(receipt.amountUsdc, true)}</Text><Text style={s.caption}>to {vault.name}</Text></View>
          <View style={s.card}><Identity vault={vault} /><View style={s.line} /><Row label="Amount" value={money(receipt.amountUsdc, true)} /><Row label="Duration" value={`${vault.durationDays} days`} /></View>
        </> : null}
        {sheet === 'details' ? <>
          {vault.description ? <Text style={s.body}>{vault.description}</Text> : null}
          <View style={s.card}><Row label="Vault value" value={money(vault.navUsdc)} /><Text style={s.caption}>{vault.valuationStatus === 'CURRENT' ? `Valued ${vault.valuedAt ? new Date(vault.valuedAt).toLocaleString() : 'recently'}` : 'Valuation unavailable'}</Text><Row label="Funding closes" value={new Date(vault.fundingClosesAt).toLocaleString()} /><Row label="Trading ends" value={new Date(vault.tradingEndsAt).toLocaleString()} />{vault.blockedReason ? <Text style={s.caption}>Settlement waiting: {vault.blockedReason.replaceAll('_', ' ')}</Text> : null}</View>
          {position ? <View style={s.card}><Row label="Delegated" value={money(position.contributedUsdc)} /><Row label="Current value" value={money(position.investmentValueUsdc)} /><Row label="Return" value={money(position.personalPnlUsdc)} /><Row label="Captain fee" value={money(position.captainFeeUsdc)} /><Row label="Final claim" value={position.claimPaid ? 'Paid' : money(position.claimableUsdc)} />
            {position.claimableUsdc !== null && !position.claimPaid && position.shares !== '0.000000' ? <Button disabled={!canAct || !!saved} onPress={() => { void submitOther('CLAIM'); }}>Claim payout / refund</Button> : null}
            {funding && position.shares !== '0.000000' ? <Button secondary disabled={!canAct || !!saved} onPress={() => { void submitOther('CANCEL'); }}>{position.isCaptain ? 'Cancel vault funding' : 'Cancel delegation'}</Button> : null}
          </View> : null}
          {saved ? <View style={s.card}><Text style={s.body}>A request needs confirmation.</Text><Button disabled={!intent.ready || intent.busy} onPress={() => { if (saved.kind === 'CONTRIBUTE') setSheet('review'); else void intent.submit(saved); }}>Check saved request</Button></View> : null}
          {vault.phase === 'ACTIVE' && position?.isCaptain ? <Button onPress={() => { close(); router.push({ pathname: '/explore', params: { vaultId: id } }); }}>Open trading markets</Button> : null}
          {position?.isCaptain ? <VaultArtwork api={data.api} id={id} onSaved={data.refresh} /> : null}
          {vault.settlement ? <View style={s.card}><Row label="Final Captain fee" value={money(vault.settlement.captainFeeUsdc)} /><Row label="Distribution pool" value={money(vault.settlement.distributionPoolUsdc)} /></View> : null}
          <Text style={s.cardTitle}>Round terms</Text><RoundTerms universeMode={vault.universeMode} /><Text selectable style={s.caption}>Terms v{vault.termsVersion} · {vault.termsHash}</Text>
        </> : null}
      </View>
    </DashboardSheet> : null}
  </View>;

}
