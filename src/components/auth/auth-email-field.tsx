import { AUTH_TEST_MODE } from '@/auth/test-access';
import { AuthIcon } from '@/components/auth/auth-icons';
import { AuthButton, AuthReveal } from '@/components/shared/motion';
import { InterFont } from '@/constants/fonts';
import { AuthPanel } from '@/constants/theme';
import type { RefObject } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { type SharedValue } from 'react-native-reanimated';
import type { AuthControlAnimation, AuthTestIDPrefix, EmailAuth } from './auth-control-types';

export function AuthEmailField({ auth, input, progress, verifying, busy, focused, invalid, testIDPrefix, enter, exit, layout, submit, onFocus, onBlur }: AuthControlAnimation & {
  auth: Pick<EmailAuth, 'stage' | 'email' | 'code' | 'updateCode' | 'updateEmail'>; input: RefObject<TextInput | null>; progress: SharedValue<number>;
  verifying: boolean; busy: boolean; focused: boolean; invalid: boolean; testIDPrefix: AuthTestIDPrefix;
  submit: () => void; onFocus: () => void; onBlur: () => void;
}) {
  return (
    <AuthReveal progress={progress} order={0} layout={layout}>
      <View style={[styles.inputFrame, focused && styles.inputFocused, invalid && styles.inputError]}>
        <Animated.View key={auth.stage} entering={enter} exiting={exit} style={styles.fieldIcon}>
          <AuthIcon name={verifying ? 'lock' : 'mail'} size={20} />
        </Animated.View>
        <TextInput
          ref={input} testID={`${testIDPrefix}-${verifying ? 'code' : 'email'}`}
          accessibilityLabel={verifying ? '6-digit verification code' : 'Email address'}
          accessibilityHint={AUTH_TEST_MODE ? 'Optional for this app preview' : verifying ? 'Enter the code from your email' : 'Sign in or create an account. We will email you a code.'}
          style={[styles.input, verifying && styles.codeInput]}
          value={verifying ? auth.code : auth.email}
          onChangeText={verifying ? auth.updateCode : auth.updateEmail}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={verifying ? '000000' : 'Your email address'}
          placeholderTextColor={AuthPanel.placeholder}
          autoCapitalize="none" autoCorrect={false} spellCheck={false}
          keyboardType={verifying ? 'number-pad' : 'email-address'}
          textContentType={verifying ? 'oneTimeCode' : 'emailAddress'}
          autoComplete={verifying ? 'one-time-code' : 'email'}
          returnKeyType="go" maxLength={verifying ? 12 : 254}
          editable={!busy} onSubmitEditing={submit}
          selectionColor={AuthPanel.primary} underlineColorAndroid="transparent" />
        {!verifying && auth.email.length > 0 ? (
          <AuthButton
            accessibilityRole="button" accessibilityLabel="Clear email address"
            disabled={busy} style={styles.clearButton} hitSlop={4}
            onPress={() => { auth.updateEmail(''); input.current?.focus(); }}>
            <AuthIcon name="clear" size={18} />
          </AuthButton>
        ) : null}
      </View>
    </AuthReveal>
  );
}

const styles = StyleSheet.create({
  inputFrame: {
    minHeight: AuthPanel.controlHeight, flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingLeft: 14, borderRadius: AuthPanel.controlRadius,
    borderWidth: 1, borderColor: 'transparent', backgroundColor: AuthPanel.field,
  },
  fieldIcon: { width: 20, height: 22, justifyContent: 'center', alignItems: 'center' },
  inputFocused: { borderColor: AuthPanel.focusBorder, backgroundColor: 'rgba(255,255,255,0.72)' },
  inputError: { borderColor: AuthPanel.error },
  input: {
    flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 10, paddingRight: 10,
    fontFamily: InterFont.regular, fontSize: AuthPanel.inputSize,
    color: AuthPanel.ink, borderWidth: 0, outlineWidth: 0,
  },
  codeInput: { fontSize: AuthPanel.codeSize, letterSpacing: 8, textAlign: 'center' },
  clearButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
