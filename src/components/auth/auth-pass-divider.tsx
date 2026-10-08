import { StyleSheet, View } from 'react-native';
import { AuthPanel as A } from '@/constants/theme';

/** The boarding-pass tear line shares the auth card’s calm coastal palette. */
export function AuthPassDivider({ edgeInset = 23 }: { edgeInset?: number }) {
  return <View style={styles.divider} accessible={false} testID="auth-pass-divider">
    <View style={[styles.notch, { left: -edgeInset - 10 }]} />
    <View style={styles.line} />
    <View style={[styles.notch, { right: -edgeInset - 10 }]} />
  </View>;
}

const styles = StyleSheet.create({
  divider: { width: '100%', height: 20, justifyContent: 'center', marginTop: 15 },
  line: { borderBottomWidth: 1, borderColor: A.border, borderStyle: 'dashed' },
  notch: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: A.backdrop },
});
