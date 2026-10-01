import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Compass, House, Settings, Wallet, type LucideIcon } from 'lucide-react-native';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { Dashboard, WalletPalette } from '@/constants/theme';

function VoyageTab({ isFocused, label, icon: Icon, style: _style, compact = false, walletMode = false, ...props }: TabTriggerSlotProps & { label: string; icon: LucideIcon; compact?: boolean; walletMode?: boolean }) {
  const isHome = label === 'Home';
  return (
    <AuthButton {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      testID={`nav-${label.toLowerCase()}`}
      style={isHome ? [styles.home, compact && styles.compactHome, walletMode && styles.walletHome] : styles.iconTab}>
      {isHome ? <>
        {!walletMode && <LinearGradient colors={isFocused ? Dashboard.activeGradient : ['#8191AB', '#6C7E9A']} style={StyleSheet.absoluteFill} pointerEvents="none" />}
        <View style={styles.homeIcon}>
          <Svg width={24} height={24} viewBox="0 0 24 24"
            accessible={Platform.OS === 'web' ? undefined : false} aria-hidden={Platform.OS === 'web' ? true : undefined}>
            <Path d="M2 10 10.5 2.7a2.3 2.3 0 0 1 3 0L22 10v10a2 2 0 0 1-2 2h-5v-7a3 3 0 0 0-6 0v7H4a2 2 0 0 1-2-2Z" fill={walletMode ? WalletPalette.secondary : '#FFFFFF'} />
          </Svg>
        </View>
        <Text style={[styles.homeLabel, walletMode && styles.walletHomeLabel]}>Home</Text>
      </> : <View style={[styles.iconCircle, isFocused && styles.selectedCircle, walletMode && styles.walletCircle, walletMode && isFocused && styles.walletSelected]}>
        <Icon size={22} color={walletMode ? WalletPalette.selectedInk : isFocused ? '#425A80' : '#7183A1'} strokeWidth={isFocused ? 2 : 1.8} />
      </View>}
    </AuthButton>
  );
}

export default function VoyageTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const walletMode = usePathname() === '/wallet';
  const barWidth = Math.min(width - 36, Dashboard.maxWidth);
  const compact = width < 360;
  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <TabList style={styles.routeList}>
        <TabTrigger name="home" href="/" />
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="wallet" href="/wallet" />
        <TabTrigger name="settings" href="/settings" />
      </TabList>
      <View pointerEvents="box-none" accessibilityRole="tablist"
        style={[styles.bar, { width: barWidth, left: (width - barWidth) / 2, bottom: Math.max(insets.bottom + 12, 42) }]} testID="voyage-tab-bar">
        <TabTrigger name="home" asChild><VoyageTab label="Home" icon={House} compact={compact} walletMode={walletMode} /></TabTrigger>
        <View style={[styles.iconGroup, compact && styles.compactIconGroup, walletMode && styles.walletGroup]} testID="nav-icon-group">
          <TabTrigger name="explore" asChild><VoyageTab label="Discover" icon={Compass} walletMode={walletMode} /></TabTrigger>
          <TabTrigger name="wallet" asChild><VoyageTab label="Wallet" icon={Wallet} walletMode={walletMode} /></TabTrigger>
          <TabTrigger name="settings" asChild><VoyageTab label="Settings" icon={Settings} walletMode={walletMode} /></TabTrigger>
        </View>
      </View>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Dashboard.background },
  slot: { flex: 1 },
  routeList: { display: 'none' },
  bar: { position: 'absolute', height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  home: { width: 138, height: 60, borderRadius: 30, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', boxShadow: '0 8px 24px rgba(57,78,113,0.24)' },
  compactHome: { width: 122 },
  homeLabel: { fontFamily: InterFont.medium, fontSize: 15, color: '#FFFFFF' },
  homeIcon: { width: 24, height: 24 },
  iconGroup: { width: 174, height: 56, paddingHorizontal: 7, borderRadius: 28, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0 6px 22px rgba(81,103,140,0.1)' },
  compactIconGroup: { width: 150 },
  iconTab: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  selectedCircle: { backgroundColor: '#E7EDF6' },
  walletHome: { height: 52, backgroundColor: WalletPalette.surface, boxShadow: WalletPalette.shadow },
  walletHomeLabel: { color: WalletPalette.secondary },
  walletGroup: { backgroundColor: 'transparent', borderWidth: 0, boxShadow: 'none', paddingHorizontal: 0 },
  walletCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: WalletPalette.surface },
  walletSelected: { backgroundColor: WalletPalette.selected },
});
