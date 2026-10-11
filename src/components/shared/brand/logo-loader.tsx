import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

/** Shows the original brand artwork without an entrance or loading animation. */
export function LogoLoader({ size = 120, loading = false }: { size?: number; loading?: boolean }) {
  return (
    <View style={{ width: size, height: size }} accessible
      accessibilityRole={loading ? 'progressbar' : 'image'} accessibilityLabel={loading ? 'Loading Socially' : 'Socially'}
      accessibilityState={{ busy: loading }}>
      <Image source={require('@/assets/images/splash-icon.png')} style={StyleSheet.absoluteFill}
        contentFit="contain" transition={0} accessibilityElementsHidden importantForAccessibility="no" />
    </View>
  );
}
