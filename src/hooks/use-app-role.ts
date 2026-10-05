import { useHomePreview } from '@/components/dev/home-preview-provider';
import { useAccountSettings } from '@/components/settings/settings-provider';

/** One role decision for Home and Discover, including the local developer preview. */
export function useAppRole() {
  const { settings } = useAccountSettings();
  const { role: previewRole } = useHomePreview();
  return (__DEV__ ? previewRole : null) ?? settings.role ?? 'crew';
}
