import { DashboardSheetTheme as S, Dashboard } from './dashboard';
import { DiscoverPalette as D } from './discover';

/** Pearl-glass inbox selected from notification popup concept 01. */
export const NotificationPalette = {
  ink: D.ink, secondary: D.secondary, line: '#D5E2EF',
  border: S.border, pointer: '#FCFEFF',
  surface: ['#FCFEFF', '#F8FBFF', '#F1F7FD'] as const,
  toastSweep: ['rgba(152,211,245,0)', 'rgba(152,211,245,0.32)', 'rgba(152,211,245,0)'] as const,
  unread: '#4388F7', icon: '#245F98', iconSurface: '#E1EEFF',
  positive: '#08775F', positiveSurface: '#D9FAEE',
  risk: '#96520C', riskSurface: '#FFF7ED', riskBorder: '#D9A568',
  action: '#245F98',
  backdrop: 'rgba(16,36,59,0.18)',
  shadow: '0 14px 38px rgba(37,60,96,0.18)',
  bellSelected: '#E1EEFF', bellDot: Dashboard.negative,
  radius: 24, maxWidth: 350, maxHeight: 520, inset: 16,
} as const;
