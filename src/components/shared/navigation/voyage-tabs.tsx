import { LinearGradient } from 'expo-linear-gradient';
import { usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Compass, House, Settings, Wallet, type LucideIcon } from 'lucide-react-native';
import { useEffect } from 'react';
import { Keyboard, Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/shared/motion';
import { selectionFeedback } from '@/components/shared/feedback';
import { ConnectionNotice } from './connection-notice';
import { InterFont } from '@/constants/fonts';
import { Motion } from '@/constants/motion';
import { Dashboard } from '@/constants/theme';

function VoyageTab({ isFocused, label, icon: Icon, style: _style, compact = false, onPress, ...props }: TabTriggerSlotProps & { label: string; icon: LucideIcon; compact?: boolean }) {
  const isHome = label === 'Home';
  return (
    <AuthButton {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      onPress={event => { Keyboard.dismiss(); if (!isFocused) selectionFeedback(); onPress?.(event); }}
      testID={`nav-${label.toLowerCase()}`}
      style={isHome ? [styles.home, compact && styles.compactHome] : styles.iconTab}>
      {isHome ? <>
        {/* Clip the painted surface separately so the outer shadow/focus ring stays round and visible. */}
        <View style={[StyleSheet.absoluteFill, styles.homeSurface]} pointerEvents="none">
          <LinearGradient colors={isFocused ? Dashboard.activeGradient : ['#8191AB', '#6C7E9A']}
            style={[StyleSheet.absoluteFill, styles.homeGradient]} />
        </View>
        <View style={styles.homeIcon}>
          <Svg width={24} height={24} viewBox="0 0 24 24"
            accessible={Platform.OS === 'web' ? undefined : false} aria-hidden={Platform.OS === 'web' ? true : undefined}>
            <Path d="M2 10 10.5 2.7a2.3 2.3 0 0 1 3 0L22 10v10a2 2 0 0 1-2 2h-5v-7a3 3 0 0 0-6 0v7H4a2 2 0 0 1-2-2Z" fill="#FFFFFF" />
          </Svg>
        </View>
        <Text style={styles.homeLabel}>Home</Text>
      </> : <View style={styles.iconCircle}>
        <Icon size={22} color={isFocused ? '#425A80' : '#7183A1'} strokeWidth={isFocused ? 2 : 1.8} />
      </View>}
    </AuthButton>
  );
}

export default function VoyageTabs() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const barWidth = Math.min(width - 36, Dashboard.maxWidth);
  const compact = width < 360;
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const selectedIndex = ['/explore', '/wallet', '/settings'].indexOf(pathname);
  const cellWidth = ((compact ? 150 : 174) - 16) / 3;
  const indicatorX = useSharedValue(Math.max(selectedIndex, 0) * cellWidth);
  const indicatorOpacity = useSharedValue(selectedIndex < 0 ? 0 : 1);
  useEffect(() => {
    if (selectedIndex >= 0) {
      const next = selectedIndex * cellWidth;
      indicatorX.set(reduceMotion ? next : withTiming(next, { duration: Motion.transition }));
    }
    indicatorOpacity.set(reduceMotion ? Number(selectedIndex >= 0) : withTiming(Number(selectedIndex >= 0), { duration: Motion.feedback }));
  }, [selectedIndex, cellWidth, reduceMotion, indicatorX, indicatorOpacity]);
  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.get(), transform: [{ translateX: indicatorX.get() }],
  }));
  const barBottom = Math.max(insets.bottom + 12, 42);
  return (
    <Tabs style={styles.root} options={{ backBehavior: 'history' }}>
      <TabSlot style={styles.slot} />
      <TabList style={styles.routeList}>
        <TabTrigger name="home" href="/" />
        <TabTrigger name="explore" href="/explore" />
        <TabTrigger name="wallet" href="/wallet" />
        <TabTrigger name="settings" href="/settings" />
      </TabList>
      <View nativeID="voyage-bottom-navigation" pointerEvents="box-none" accessibilityRole="tablist"
        style={[styles.bar, { width: barWidth, left: (width - barWidth) / 2, bottom: barBottom }]} testID="voyage-tab-bar">
        <TabTrigger name="home" resetOnFocus={false} asChild><VoyageTab label="Home" icon={House} compact={compact} /></TabTrigger>
        <View style={[styles.iconGroup, compact && styles.compactIconGroup]} testID="nav-icon-group">
          <Animated.View pointerEvents="none" testID="nav-selection-indicator"
            style={[styles.selectedCircle, { left: 7 + (cellWidth - 40) / 2 }, indicatorStyle]} />
          <TabTrigger name="explore" resetOnFocus={false} asChild><VoyageTab label="Discover" icon={Compass} /></TabTrigger>
          <TabTrigger name="wallet" resetOnFocus={false} asChild><VoyageTab label="Wallet" icon={Wallet} /></TabTrigger>
          <TabTrigger name="settings" resetOnFocus={false} asChild><VoyageTab label="Settings" icon={Settings} /></TabTrigger>
        </View>
      </View>
      <ConnectionNotice bottom={barBottom + 72} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Dashboard.background },
  slot: { flex: 1 },
  routeList: { display: 'none' },
  bar: { position: 'absolute', zIndex: 20, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  home: { width: 138, height: 60, borderRadius: 30, outlineStyle: 'solid', backgroundColor: '#657A9C', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', boxShadow: '0 8px 24px rgba(57,78,113,0.24)' },
  homeSurface: { borderRadius: 29, overflow: 'hidden' },
  homeGradient: { borderRadius: 29 },
  compactHome: { width: 122 },
  homeLabel: { fontFamily: InterFont.medium, fontSize: 15, color: '#FFFFFF' },
  homeIcon: { width: 24, height: 24 },
  iconGroup: { width: 174, height: 56, paddingHorizontal: 7, borderRadius: 28, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0 6px 22px rgba(81,103,140,0.1)' },
  compactIconGroup: { width: 150 },
  iconTab: { flex: 1, height: 48, borderRadius: 24, outlineStyle: 'solid', alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  selectedCircle: { position: 'absolute', top: 7, width: 40, height: 40, borderRadius: 20, backgroundColor: '#E7EDF6' },
});
