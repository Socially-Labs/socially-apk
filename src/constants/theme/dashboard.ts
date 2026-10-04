/** The airy, fixed-light voyage dashboard shown in the home reference. */
export const Dashboard = {
  background: '#F5F7FB',
  ink: '#070E27',
  secondary: '#8A97B1',
  icon: '#7B8BA9',
  line: '#E0E6F0',
  glass: 'rgba(255,255,255,0.82)',
  softGlass: 'rgba(255,255,255,0.64)',
  positive: '#00B875',
  positiveTint: 'rgba(0,184,117,0.07)',
  negative: '#FF3B57',
  negativeTint: 'rgba(255,59,87,0.06)',
  activeGradient: ['#657A9C', '#506587'] as const,
  shadow: '0 12px 34px rgba(84,107,146,0.12)',
  maxWidth: 560,
} as const;

/** Rounded, inset detail sheets inherit the dashboard's cool white surfaces. */
export const DashboardSheetTheme = {
  surface: '#F6F9FD',
  gradient: ['#FCFDFF', '#F0F5FC'] as const,
  border: 'rgba(255,255,255,0.94)',
  body: 'rgba(255,255,255,0.7)',
  bodyBorder: 'rgba(221,229,241,0.64)',
  backdrop: 'rgba(27,44,70,0.3)',
  handle: '#AEBED2',
  close: '#E9EFF8',
  shadow: '0 20px 56px rgba(37,60,96,0.2)',
  radius: 32,
  bodyRadius: 22,
  titleSize: 20,
  inset: 8,
  openDuration: 360,
  closeDuration: 260,
} as const;
