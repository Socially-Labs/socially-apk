#!/usr/bin/env bash
#
# Capture Android runtime + JS errors from a connected device or emulator.
#
# Why this exists: a red screen in LogBox is usually NOT a JavaScript error. Native
# crashes (e.g. "addViewAt: failed to insert view", "[RNScreens] Unexpected fragment
# manager state.") are thrown by Kotlin/Java and never reach the Metro terminal, so
# they are invisible unless you read logcat. Run this, reproduce the crash, then paste
# the output back.
#
# Usage:
#   scripts/android-crash-log.sh            # stream live (Ctrl-C to stop)
#   scripts/android-crash-log.sh --repro    # clear, then stream (best for a one-shot repro)
#   scripts/android-crash-log.sh --save     # stream and also write logs/android-crash.log
#
set -uo pipefail

MODE="${1:-stream}"
OUT_FILE="${2:-logs/android-crash.log}"

# Find adb: PATH first, then the usual SDK install locations.
find_adb() {
  if command -v adb >/dev/null 2>&1; then
    command -v adb
    return 0
  fi
  local candidate
  for candidate in \
    "${ANDROID_HOME:-}/platform-tools/adb" \
    "${ANDROID_SDK_ROOT:-}/platform-tools/adb" \
    "$HOME/Library/Android/sdk/platform-tools/adb" \
    "$HOME/Android/Sdk/platform-tools/adb"
  do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

if ! ADB="$(find_adb)"; then
  cat >&2 <<'EOF'
error: adb not found.

Native Android errors only show up in logcat, so we need adb to read them.
Install it with either:

  brew install --cask android-platform-tools     # macOS
  sdkmanager "platform-tools"                     # Android Studio

or point at an existing SDK:

  export ANDROID_HOME="$HOME/Library/Android/sdk"
EOF
  exit 1
fi

if ! "$ADB" get-state >/dev/null 2>&1; then
  cat >&2 <<'EOF'
error: no device/emulator connected.

Pick whichever applies:

USB
  1. Plug the phone in with a data (not charge-only) cable
  2. Phone -> Settings -> About phone -> tap "Build number" 7x (enables Developer options)
  3. Phone -> Developer options -> "USB debugging" ON
  4. Accept the "Allow USB debugging?" prompt on the phone

Wi-Fi (Android 11+, no cable needed)
  1. Phone -> Developer options -> "Wireless debugging" ON
  2. Tap "Pair device with pairing code", note the IP:PORT it shows
  3. Run:  adb pair <phone-ip>:<port>       (then type the 6-digit code)
  4. Run:  adb connect <phone-ip>:<debug-port>
     (debug port is the one on the main Wireless debugging screen)

Verify with:  adb devices
EOF
  exit 1
fi

# Only the tags that carry real error signal. Keeps output readable.
#
# SurfaceMountingManager matters most: right before an "addViewAt: failed to insert
# view" crash it logs a soft exception naming the view's real previous parent. That
# line is the difference between guessing and knowing.
FILTERS='AndroidRuntime:E SurfaceMountingManager:V ReactNativeJS:V ReactNative:V ReactViewGroup:V RNScreens:V TabsContainer:V TabsHost:V *:S'

case "$MODE" in
  --repro)
    echo "Clearing logcat. Reproduce the crash now, then press Ctrl-C."
    "$ADB" logcat -c
    exec "$ADB" logcat -v brief "$FILTERS"
    ;;
  --save)
    mkdir -p "$(dirname "$OUT_FILE")"
    echo "Streaming to $OUT_FILE (Ctrl-C to stop)"
    exec "$ADB" logcat -v brief "$FILTERS" | tee "$OUT_FILE"
    ;;
  stream|*)
    exec "$ADB" logcat -v brief "$FILTERS"
    ;;
esac