import { Platform } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { AuthPanel } from '@/constants/theme';

// Render vectors directly on native and web instead of passing SVG data URLs
// through platform image decoders. All icons are bundled and work offline.
const paths = {
  mail: `<g fill="none" stroke="${AuthPanel.secondary}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/></g>`,
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  back: `<path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="${AuthPanel.secondary}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
  clear: `<circle cx="12" cy="12" r="10" fill="${AuthPanel.clear}"/><path d="m8.5 8.5 7 7m0-7-7 7" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"/>`,
  lock: `<g fill="none" stroke="${AuthPanel.secondary}" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></g>`,
  google: '<path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.59 4.59 0 0 1-1.99 3.01v2.5h3.23c1.89-1.74 2.98-4.3 2.98-7.34Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.89.6-2.03.96-3.39.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.51H3.06a10 10 0 0 0 0 8.98L6.4 13.9Z"/><path fill="#EA4335" d="M12 5.97c1.47 0 2.79.51 3.83 1.51l2.88-2.88A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.51L6.4 10.1c.79-2.37 3-4.13 5.6-4.13Z"/>',
  apple: '<path fill="#0D1420" d="M17.05 12.54c.02 3.03 2.66 4.04 2.69 4.05-.02.07-.42 1.44-1.39 2.86-.84 1.23-1.71 2.45-3.08 2.48-1.35.03-1.78-.8-3.32-.8-1.54 0-2.02.77-3.3.83-1.32.05-2.32-1.32-3.17-2.54-1.73-2.49-3.05-7.03-1.28-10.1a4.92 4.92 0 0 1 4.17-2.53c1.3-.02 2.53.88 3.32.88.8 0 2.29-1.09 3.86-.93.66.03 2.5.27 3.69 2.01-.09.06-2.21 1.29-2.19 3.79ZM14.52 5.03c.71-.86 1.19-2.05 1.06-3.23-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.07 3.14 1.14.09 2.29-.58 3-1.45Z"/>',
  twitter: '<path fill="#0D1420" d="M18.9 2H22l-6.77 7.74L23.2 22h-6.24l-4.88-7.39L5.61 22H2.48l7.24-8.27L1.8 2h6.4l4.42 6.75L18.9 2Zm-1.1 18h1.73L7.25 3.88H5.39L17.8 20Z"/>',
} as const;

const sources = Object.fromEntries(Object.entries(paths).map(([name, path]) => [
  name, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${path}</svg>`,
]));

export function AuthIcon({ name, size = 22 }: { name: keyof typeof paths; size?: number }) {
  return (
    <SvgXml
      xml={sources[name]} width={size} height={size} testID={`auth-icon-${name}`}
      accessible={Platform.OS === 'web' ? undefined : false}
      aria-hidden={Platform.OS === 'web' ? true : undefined} />
  );
}
