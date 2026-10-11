import { StyleSheet, Text, View } from 'react-native';
import type { CrewCaptain } from '@/api/crew-discovery';
import { captainExperience } from '@/api/captain-experience';
import { InterFont } from '@/constants/fonts';
import { DiscoverPalette as D } from '@/constants/theme';

export function CaptainExperienceBadge({ captain }: { captain: CrewCaptain }) {
  const experience = captainExperience(captain.history);
  const veteran = experience?.label === 'Veteran';
  return <View testID={`captain-experience-${captain.id}`} accessible
    accessibilityLabel={experience ? `${experience.label}. ${experience.days} days with recorded valuations. Veteran starts at 90 recorded days.${captain.isDemo ? ' Simulated history.' : ''}` : 'History unavailable. Experience tier has not been assigned.'}
    style={[s.badge, veteran && s.veteran]}>
    <Text style={[s.label, veteran && s.veteranText]}>{experience ? `${experience.label} · ${experience.days} ${experience.days === 1 ? 'day' : 'days'}` : 'History pending'}</Text>
  </View>;
}
const s = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6, backgroundColor: D.surface, borderWidth: 1, borderColor: D.line },
  veteran: { backgroundColor: D.ink, borderColor: D.ink },
  label: { fontFamily: InterFont.semiBold, fontSize: 11, lineHeight: 16, color: D.ink },
  veteranText: { color: D.heroInk },
});
