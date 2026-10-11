# Sailing ship loader

- [Live motion preview](./preview.html) — app context, smaller sizes and pause control.
- [Animated SVG](./sailing-ship.svg) — transparent vector source, 240 × 168 viewBox.
- [APK still preview](./apk-preview.png).
- [Design board](./design-board.png).

Two masts, curved sails, rigging, deep navy hull, portholes and bowsprit. Ship pitching and sail movement run on a seamless 3.2-second loop. Water travels on separate 2.4- and 3.8-second loops; bow wake dissolves over 1.6 seconds. Reduced-motion mode displays a still ship.

The preview uses browser CSS animation inside a hand-authored SVG. For native integration, reuse the vector paths with react-native-svg and animate the transforms with Reanimated; embedded browser CSS does not run directly in react-native-svg. No production APK screens or navigation were modified.

Verified in Chromium: transforms change over time, pause freezes animation, reduced motion disables animation, and no JavaScript runtime errors occur.
