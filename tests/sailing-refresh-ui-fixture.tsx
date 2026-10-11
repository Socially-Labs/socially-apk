// Browser harness for touch arbitration and actual asynchronous refresh completion.
// @ts-expect-error Existing browser harnesses use the installed React DOM client.
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ExpoRoot, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AppFontMap } from '@/constants/fonts';
import { SailingRefresh } from '@/components/shared/refresh/sailing-refresh';
function Layout() {
  const [loaded] = useFonts(AppFontMap);
  return loaded ? <SafeAreaProvider><Stack screenOptions={{ headerShown: false, animation: 'none' }}/></SafeAreaProvider> : null;
}
function Screen() {
  const [refreshing, setRefreshing] = useState(false), [count, setCount] = useState(0), [error, setError] = useState('');
  const [mode, setMode] = useState<'promise' | 'controlled' | 'failure'>('promise');
  function refresh() {
    setCount(value => value + 1); setError(''); setRefreshing(true);
    const task = new Promise<void>((resolve, reject) => setTimeout(() => {
      setRefreshing(false);
      if (mode === 'failure') { setError('Refresh failed. Try again.'); reject(new Error('fixture failure')); } else resolve();
    }, 1100));
    if (mode === 'controlled') { void task; return; }
    return task;
  }
  return <View style={{ flex: 1, backgroundColor: '#F5F7FB' }}>
    <SailingRefresh refreshing={refreshing} onRefresh={refresh}>{props => <ScrollView {...props} testID="refresh-test-scroll" contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 28 }}>Ship refresh</Text><Text testID="refresh-count">{count}</Text>
      <Text testID="refresh-result">{refreshing ? 'request pending' : 'request settled'}</Text>
      <Text>{error}</Text>
      <View style={{ flexDirection: 'row', gap: 15, paddingVertical: 20 }}>{(['promise', 'controlled', 'failure'] as const).map(value => <Pressable key={value} testID={`mode-${value}`} accessibilityRole="button" onPress={() => setMode(value)}><Text>{value}</Text></Pressable>)}</View>
      <ScrollView horizontal testID="refresh-test-carousel"><View style={{ width: 900, height: 70, backgroundColor: '#E6EFF8' }}><Text>Horizontal carousel</Text></View></ScrollView>
      {Array.from({ length: 25 }, (_, index) => <View key={index} style={{ height: 80, paddingTop: 25, borderBottomWidth: 1, borderColor: '#E3EAF1' }}><Text>Row {index + 1}</Text></View>)}
    </ScrollView>}</SailingRefresh>
  </View>;
}
const modules: Record<string, { default: () => React.JSX.Element | null }> = { './_layout.tsx': { default: Layout }, './refresh-test.tsx': { default: Screen } };
const context = Object.assign((key: string) => modules[key], { keys: () => Object.keys(modules), resolve: (key: string) => key, id: 'ship-refresh-fixture' });
createRoot(document.getElementById('root')!).render(<ExpoRoot context={context}/>);
