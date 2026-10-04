import { errorFeedback, selectionFeedback, successFeedback } from '@/components/shared/feedback';
import { AuthButton } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { SettingsPalette as S } from '@/constants/theme';
import { Camera, Check, ImagePlus, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { ProfileAvatar } from './profile-avatar';
import { ProfileBanner } from './profile-banner';
import { pickProfileMedia, type ProfileMediaKind } from './profile-media';
import { profileFromSettings, usernameError } from './profile-model';
import { sharedStyles } from './settings-detail-styles';
import { Action, Card, ErrorCopy } from './settings-detail-ui';
import { useAccountSettings, type ProfileDraft } from './settings-provider';

export function ProfileEditor() {
  const { settings, ready, saving, profileDraft, updateProfileDraft, updateSettings, error: storageError } = useAccountSettings();
  const draft = profileDraft ?? profileFromSettings(settings);
  const { name, username, bio, avatar, photoUri, bannerUri } = draft;
  const nameInput = useRef<TextInput>(null);
  const usernameInput = useRef<TextInput>(null);
  const bioInput = useRef<TextInput>(null);
  const mounted = useRef(true);
  const pickerBusy = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [touched, setTouched] = useState({ name: false, username: false });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [picking, setPicking] = useState<ProfileMediaKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== settings.name || username !== settings.username || bio.trim() !== settings.bio || avatar !== settings.avatar || photoUri !== settings.photoUri || bannerUri !== settings.bannerUri;
  const locked = !ready || saving || picking !== null;
  const nameError = touched.name && !name.trim() ? 'Please enter your display name.' : null;
  const handleError = touched.username ? usernameError(username) : null;
  function edit(patch: Partial<ProfileDraft>) {
    updateProfileDraft({ ...draft, ...patch });
    setSaved(false); setError(null); setMediaError(null);
  }
  async function chooseMedia(kind: ProfileMediaKind) {
    if (locked || pickerBusy.current) return;
    pickerBusy.current = true; setPicking(kind); setMediaError(null); Keyboard.dismiss();
    try {
      const uri = await pickProfileMedia(kind);
      if (uri && mounted.current) { edit(kind === 'photo' ? { photoUri: uri } : { bannerUri: uri }); selectionFeedback(); }
    } catch { if (mounted.current) { errorFeedback(); setMediaError('This image couldn’t be opened. Please choose another photo.'); } }
    finally { pickerBusy.current = false; if (mounted.current) setPicking(null); }
  }
  async function save() {
    if (locked || !dirty) return;
    setTouched({ name: true, username: true });
    if (!name.trim()) { errorFeedback(); nameInput.current?.focus(); return; }
    if (usernameError(username)) { errorFeedback(); usernameInput.current?.focus(); return; }
    setError(null); setSaved(false); Keyboard.dismiss();
    try { await updateSettings({ ...draft, name: name.trim(), bio: bio.trim() }); setSaved(true); successFeedback(); }
    catch (cause) { errorFeedback(); setError(cause instanceof Error ? cause.message : 'Your profile couldn’t be saved. Please try again.'); }
  }
  return <>
    <Text style={styles.intro}>A familiar face. A name that’s yours.</Text>
    <View style={styles.mediaCard}>
      <ProfileBanner uri={bannerUri} />
      <AuthButton testID="profile-change-banner" accessibilityRole="button" accessibilityLabel="Change banner" accessibilityState={{ disabled: locked, busy: picking === 'banner' }} disabled={locked}
        onPress={() => { void chooseMedia('banner'); }} style={styles.bannerButton}>
        {picking === 'banner' ? <ActivityIndicator size="small" color={S.accent} /> : <ImagePlus size={15} color={S.ink} />}
        <Text style={styles.mediaButtonText}>Change banner</Text>
      </AuthButton>
      <View style={styles.mediaBody}>
        <View style={styles.mediaTop}>
          <AuthButton testID="profile-change-photo" accessibilityRole="button" accessibilityLabel="Change profile photo" accessibilityState={{ disabled: locked, busy: picking === 'photo' }} disabled={locked}
            onPress={() => { void chooseMedia('photo'); }} style={styles.avatarRing}>
            <ProfileAvatar name={name || settings.name} avatar={avatar} photoUri={photoUri} size={80} />
            <View style={styles.cameraBadge}>{picking === 'photo' ? <ActivityIndicator size="small" color={S.accent} /> : <Camera size={14} color={S.accent} />}</View>
          </AuthButton>
          <AuthButton accessibilityRole="button" accessibilityLabel="Choose profile photo" disabled={locked} onPress={() => { void chooseMedia('photo'); }} style={styles.photoButton}><Text style={styles.photoButtonText}>{photoUri ? 'Change photo' : 'Add a photo'}</Text></AuthButton>
        </View>
        <ErrorCopy>{mediaError}</ErrorCopy>
        <View style={styles.mediaNote}><Text style={styles.note}>Wide photos work best for your banner.</Text>{bannerUri ? <AuthButton testID="profile-remove-banner" accessibilityRole="button" accessibilityLabel="Reset banner" disabled={locked} onPress={() => edit({ bannerUri: null })} style={styles.reset}><X size={13} color={S.secondary} /><Text style={styles.resetText}>Reset</Text></AuthButton> : null}</View>
        {photoUri ? <AuthButton testID="profile-remove-photo" accessibilityRole="button" disabled={locked} onPress={() => edit({ photoUri: null })} style={styles.removePhoto}><Text style={styles.resetText}>Remove photo</Text></AuthButton> : <View style={styles.avatarOptions}>{(['captain', 'initials'] as const).map(kind => <AuthButton key={kind}
          accessibilityRole="button" accessibilityLabel={kind === 'captain' ? 'Captain avatar' : 'Initials avatar'} accessibilityState={{ selected: avatar === kind, disabled: locked }}
          disabled={locked} onPress={() => { if (kind !== avatar) selectionFeedback(); edit({ avatar: kind }); }} style={[styles.avatarOption, avatar === kind && styles.selected]}>
          <ProfileAvatar name={name || settings.name} avatar={kind} size={30} /><Text style={styles.optionText}>{kind === 'captain' ? 'Captain' : 'Initials'}</Text>{avatar === kind ? <Check size={14} color={S.accent} /> : null}
        </AuthButton>)}</View>}
      </View>
    </View>
    <Card>
      <Text style={styles.formHeading} accessibilityRole="header">Your details</Text>
      <Text style={styles.label}>Display name</Text>
      <TextInput ref={nameInput} testID="profile-name" accessibilityLabel="Display name" accessibilityHint={nameError ?? 'Up to 40 characters'} value={name} maxLength={40} editable={!locked}
        onChangeText={value => edit({ name: value })} placeholder="Your name" placeholderTextColor={S.secondary}
        onFocus={() => setFocusedField('name')} onBlur={() => { setFocusedField(null); setTouched(current => ({ ...current, name: true })); }}
        autoCapitalize="words" autoComplete="name" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => usernameInput.current?.focus()}
        style={[styles.input, focusedField === 'name' && styles.inputFocused, nameError && styles.inputInvalid]} />
      <ErrorCopy>{nameError}</ErrorCopy>
      <Text style={styles.label}>Username</Text>
      <View style={[styles.usernameField, focusedField === 'username' && styles.inputFocused, handleError && styles.inputInvalid]}>
        <Text style={styles.at}>@</Text>
        <TextInput ref={usernameInput} testID="profile-username" accessibilityLabel="Username" accessibilityHint={handleError ?? '3 to 24 characters, starting with a letter'} value={username} maxLength={24} editable={!locked}
          onChangeText={value => edit({ username: value.toLowerCase().replace(/^@/, '') })} placeholder="your_username" placeholderTextColor={S.secondary}
          autoCapitalize="none" autoCorrect={false} spellCheck={false} autoComplete="off" returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => bioInput.current?.focus()}
          onFocus={() => setFocusedField('username')} onBlur={() => { setFocusedField(null); setTouched(current => ({ ...current, username: true })); }} style={styles.usernameInput} />
      </View>
      <ErrorCopy>{handleError}</ErrorCopy>
      <Text style={styles.note}>3–24 letters, numbers or underscores. Start with a letter.</Text>
      <Text style={styles.label}>Bio <Text style={styles.optional}>(optional)</Text></Text>
      <TextInput ref={bioInput} testID="profile-bio" accessibilityLabel="Bio" accessibilityHint="Optional, up to 140 characters" value={bio} maxLength={140} editable={!locked}
        onChangeText={value => edit({ bio: value })} placeholder="A little about you and your horizon" placeholderTextColor={S.secondary}
        onFocus={() => setFocusedField('bio')} onBlur={() => setFocusedField(null)} multiline textAlignVertical="top" style={[styles.input, styles.bio, focusedField === 'bio' && styles.inputFocused]} />
      <Text style={styles.characterCount}>{bio.length}/140</Text>
      <ErrorCopy>{error ?? storageError}</ErrorCopy>
      {saved ? <Text accessibilityLiveRegion="polite" style={styles.success}>Profile saved.</Text> : null}
      {dirty ? <Text style={styles.note}>Unsaved changes · Your draft stays here while you explore.</Text> : null}
      <Action label={saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'} busy={saving} disabled={locked || !dirty} testID="profile-save" onPress={() => { void save(); }} />
      {dirty ? <AuthButton testID="profile-discard" accessibilityRole="button" disabled={locked} onPress={() => { updateProfileDraft(null); setError(null); setMediaError(null); setSaved(false); setTouched({ name: false, username: false }); Keyboard.dismiss(); }} style={styles.discard}><Text style={styles.resetText}>Discard changes</Text></AuthButton> : null}
      <Text style={styles.note}>Profile changes are saved on this device. Your username doesn’t change how you sign in.</Text>
    </Card>
  </>;
}
const styles = StyleSheet.create({
  ...sharedStyles,
  intro: { fontFamily: InterFont.regular, fontSize: 14, lineHeight: 20, color: S.secondary, marginTop: -10, marginBottom: 22 },
  mediaCard: { borderRadius: S.cardRadius, backgroundColor: S.solidSurface, borderWidth: 1, borderColor: S.border, overflow: 'hidden', marginBottom: 16 },
  bannerButton: { position: 'absolute', right: 12, top: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: 22, backgroundColor: S.coverButton, flexDirection: 'row', alignItems: 'center', gap: 7 },
  mediaButtonText: { fontFamily: InterFont.medium, fontSize: 11, color: S.ink },
  mediaBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 12 },
  mediaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: -32 },
  avatarRing: { padding: 4, borderRadius: 48, backgroundColor: S.solidSurface },
  cameraBadge: { position: 'absolute', bottom: 3, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: S.solidSurface, borderWidth: 1, borderColor: S.border, alignItems: 'center', justifyContent: 'center' },
  photoButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10, marginTop: 30 },
  photoButtonText: { fontFamily: InterFont.medium, fontSize: 12, color: S.accent },
  mediaNote: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reset: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  resetText: { fontFamily: InterFont.medium, fontSize: 12, color: S.secondary },
  removePhoto: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  avatarOptions: { flexDirection: 'row', gap: 8 },
  avatarOption: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: S.line, minHeight: 48 },
  selected: { backgroundColor: S.badge, borderColor: S.accent },
  formHeading: { fontFamily: InterFont.semiBold, fontSize: 17, lineHeight: 24, color: S.ink },
  optional: { fontFamily: InterFont.regular, color: S.secondary },
  inputFocused: { borderColor: S.accent },
  inputInvalid: { borderColor: S.danger },
  usernameField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: S.line, backgroundColor: S.field, borderRadius: 14, paddingLeft: 14, gap: 5 },
  at: { fontFamily: InterFont.regular, fontSize: 15, color: S.secondary },
  usernameInput: { flex: 1, minWidth: 0, minHeight: 50, paddingVertical: 14, paddingRight: 14, fontFamily: InterFont.regular, fontSize: 15, color: S.ink, outlineWidth: 0 },
  bio: { minHeight: 94 },
  characterCount: { textAlign: 'right', fontFamily: InterFont.regular, fontSize: 11, color: S.secondary, marginTop: -7 },
  discard: { minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
