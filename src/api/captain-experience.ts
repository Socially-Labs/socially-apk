export const VETERAN_RECORDED_DAYS = 90;
export function captainExperience(history?: { recordedDays: number }) {
  if (!history) return null;
  return { label: history.recordedDays >= VETERAN_RECORDED_DAYS ? 'Veteran' : 'Rookie', days: history.recordedDays };
}
