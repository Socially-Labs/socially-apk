import { DashboardSheetTheme as S, Dashboard } from './dashboard';
import { DiscoverPalette as D } from './discover';

/** Bell-anchored pearl popover, selected from notification concept 02. */
export const NotificationPalette = {
  ink: D.ink, secondary: D.secondary, line: '#D5E2EF',
  border: S.border, pointer: '#F3F8FE',
  unread: '#4388F7', icon: '#245F98', iconSurface: '#E1EEFF',
  positive: '#08775F', positiveSurface: '#D9FAEE',
  risk: D.risk, riskSurface: D.riskTint,
  backdrop: 'rgba(16,36,59,0.04)',
  shadow: '0 14px 38px rgba(37,60,96,0.18)',
  bellSelected: '#E1EEFF', bellDot: Dashboard.negative,
  radius: 24, maxWidth: 350, maxHeight: 390, inset: 16,
} as const;
