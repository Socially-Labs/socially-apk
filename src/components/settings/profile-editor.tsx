import { useAuth } from '@/auth/session';
import { errorFeedback, selectionFeedback, successFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { Check, Mail } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProfileAvatar } from './profile-avatar';
import { sharedStyles } from './settings-detail-styles';
import { Action, Card, ErrorCopy } from './settings-detail-ui';
import { useAccountSettings, type ProfileDraft } from './settings-provider';

export function ProfileEditor() {
  const { email } = useAuth();
  const { settings, ready, saving, profileDraft, updateProfileDraft, updateSettings, error: storageError } = useAccountSettings();
  const { name, bio, avatar } = profileDraft ?? settings;
  const nameInput = useRef<TextInput>(null);
  const bioInput = useRef<TextInput>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'bio' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== settings.name || bio.trim() !== settings.bio || avatar !== settings.avatar;
  const nameError = nameTouched && !name.trim() ? 'Please enter your display name.' : null;
  function edit(patch: Partial<ProfileDraft>) {
    updateProfileDraft({ name, bio, avatar, ...patch });
    setSaved(false);
    setError(null);
  }
  async function save() {
    if (!ready || saving || !dirty) return;
    setNameTouched(true);
    if (!name.trim()) { errorFeedback(); nameInput.current?.focus(); return; }
    setError(null);
    setSaved(false);
    Keyboard.dismiss();
    try { await updateSettings({ name: name.trim(), bio: bio.trim(), avatar }); setSaved(true); successFeedback(); }
    catch (cause) { errorFeedback(); setError(cause instanceof Error ? cause.message : 'Your profile couldn’t be saved. Please try again.'); }
  }
  return <>
    <Card>
      <View style={styles.avatarPreview}><ProfileAvatar name={name || settings.name} avatar={avatar} size={84} /></View>
      <Text style={styles.label}>Choose your avatar</Text>
      <View style={styles.avatarOptions}>{(['captain', 'initials'] as const).map(kind => <AuthButton key={kind}
        accessibilityRole="button" accessibilityLabel={kind === 'captain' ? 'Captain avatar' : 'Initials avatar'} accessibilityState={{ selected: avatar === kind, disabled: !ready || saving }}
        disabled={!ready || saving} onPress={() => { if (kind !== avatar) selectionFeedback(); edit({ avatar: kind }); }} style={[styles.avatarOption, avatar === kind && styles.selected]}>
        <ProfileAvatar name={name || settings.name} avatar={kind} size={42} />
        <Text style={styles.optionText}>{kind === 'captain' ? 'Captain' : 'Initials'}</Text>
        {avatar === kind ? <Check size={16} color={S.accent} /> : null}
      </AuthButton>)}</View>
      <Text style={styles.label}>Display name</Text>
      <TextInput ref={nameInput} testID="profile-name" accessibilityLabel="Display name" accessibilityHint={nameError ?? 'Up to 40 characters'} value={name} maxLength={40} editable={ready && !saving}
        onChangeText={value => edit({ name: value })} placeholder="Your name" placeholderTextColor={S.secondary}
        onFocus={() => setFocusedField('name')} onBlur={() => { setFocusedField(null); setNameTouched(true); }}
        autoCapitalize="words" autoComplete="name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => bioInput.current?.focus()}
        style={[styles.input, focusedField === 'name' && styles.inputFocused, nameError && styles.inputInvalid]} />
      <ErrorCopy>{nameError}</ErrorCopy>
      <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput ref={bioInput} testID="profile-bio" accessibilityLabel="Bio" accessibilityHint="Optional, up to 140 characters" value={bio} maxLength={140} editable={ready && !saving}
        onChangeText={value => edit({ bio: value })} placeholder="A little about you" placeholderTextColor={S.secondary}
        onFocus={() => setFocusedField('bio')} onBlur={() => setFocusedField(null)}
        multiline textAlignVertical="top" style={[styles.input, styles.bio, focusedField === 'bio' && styles.inputFocused]} />
      <Text style={styles.characterCount}>{bio.length}/140</Text>
      <Text style={styles.label}>Sign-in account</Text>
      <View style={styles.account}><Mail size={18} color={S.secondary} /><Text selectable style={styles.copy}>{email ?? 'Signed in with a social account or preview access'}</Text></View>
      <Text style={styles.note}>Your sign-in details are managed by your login provider. Profile changes are saved on this device.</Text>
      <ErrorCopy>{error ?? storageError}</ErrorCopy>
      {saved ? <Text accessibilityLiveRegion="polite" style={styles.success}>Profile saved.</Text> : null}
      {dirty ? <Text style={styles.note}>Unsaved changes · Your draft stays here while you explore.</Text> : null}
      <Action label={saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'} busy={saving} disabled={!ready || saving || !dirty}
        testID="profile-save" onPress={() => { void save(); }} />
    </Card>
  </>;
}

const styles = StyleSheet.create({
  ...sharedStyles,
  optional: { fontFamily: InterFont.regular, color: S.secondary },
  inputFocused: { borderColor: S.accent },
  inputInvalid: { borderColor: S.danger },
  bio: { minHeight: 94 },
  characterCount: { textAlign: 'right', fontFamily: InterFont.regular, fontSize: 11, color: S.secondary, marginTop: -7 },
  account: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatarPreview: { alignItems: 'center', marginVertical: 6 },
  avatarOptions: { flexDirection: 'row', gap: 10 },
  avatarOption: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: S.line },
  selected: { backgroundColor: S.badge, borderColor: S.accent },
});
