// Browser-only chart integration fixture; never imported by the production app.
// @ts-expect-error Existing fixture pattern uses the installed React DOM client.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import { AppFontMap } from '@/constants/fonts';
import { CrewPortfolioCard } from '@/components/home/crew-portfolio-card';
import { CaptainPortfolioChart } from '@/components/home/captain-portfolio-chart';
import { PortfolioChart } from '@/components/home/home-performance-card';
import type { CrewPeriod } from '@/constants/crew-portfolio';
import { portfolioFixture } from './captain-portfolio-fixtures';

const recorded = portfolioFixture().points;
const gaps = recorded.map((p, i) => i === 7 ? { ...p, hasGap: true, netReturnPercent: null } : p);
const flat = [42, 42, 42];
function App() {
  const [loaded] = useFonts(AppFontMap);
  const [hidden, setHidden] = useState(false), [period, setPeriod] = useState<CrewPeriod>('30D');
  if (!loaded) return null;
  return <ScrollView testID="chart-fixture-scroll" style={{ flex: 1, backgroundColor: '#F5F7FB' }} contentContainerStyle={{ padding: 20, gap: 20 }}>
    <CrewPortfolioCard hidden={hidden} canToggle onToggle={() => setHidden(value => !value)} onOverview={() => {}} period={period} onPeriod={setPeriod} compact={false} error={null} />
    <View><Text>Recorded return with a missing valuation</Text><CaptainPortfolioChart points={gaps} hidden={hidden} loading={false} unavailable={false} /></View>
    <View><Text>Second recorded chart</Text><CaptainPortfolioChart points={recorded} hidden={hidden} loading={false} unavailable={false} testID="second-return-chart" /></View>
    <View><Text>Flat value history</Text><PortfolioChart values={flat} hidden={hidden} color="#1D527F" description="Flat history" testID="flat-chart" light /></View>
    <Pressable testID="fixture-show" onPress={() => setHidden(false)}><Text>Show values</Text></Pressable>
  </ScrollView>;
}
createRoot(document.getElementById('root')!).render(<App />);
