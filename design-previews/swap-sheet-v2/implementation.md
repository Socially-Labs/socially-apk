# Frosted Harbor implementation

Selected concept: 01-frosted-harbor.png.

- Light frosted swap sheet, editorial title and amounts, token panels, compact quote details, and expandable venue fees.
- Slide to swap prepares an intent and opens the fee review. Slide to confirm requests the wallet signature. Partial drags and ordinary taps do not submit; keyboard and assistive activation are supported.
- Morphing skill: three authored cubic slots on a 24-unit grid. Arrow shaft becomes the short check stroke; upper arrowhead becomes the long stroke; lower arrowhead parks on that sibling and fades. Reanimated drives SVG geometry from gesture progress; reduced motion uses resting endpoints.
- Quotes come from the authenticated backend route /v1/me/swaps/quotes, using Raydium. Polling waits three seconds after each response, keeps requests sequential, preserves the displayed quote during updates, backs off on failures, and cancels stale replies. It pauses while dragging, reviewing, signing, closed, or backgrounded.
- Backend default allowance is 1800 quotes per user per hour; explicit environment overrides remain supported. Transaction fee and price-impact policy are unchanged.

Verification: client lint/typecheck, 12 focused client tests, 7 backend swap tests, and browser checks at 320/393/430px. Browser checks cover polling, cancellation, partial and full drags, reduced motion, keyboard confirmation, preparation/submit response loss, and recovery without duplicate creation/signing. HTTP, RPC, and signing were fixtures for browser checks; no real transaction was broadcast. Native-device gestures and a rebuilt APK were not tested.

Existing live limitation: Raydium may return a priority fee above the backend policy, blocking preparation. This design change does not alter that policy.

Implemented screenshots: implemented-frosted-harbor-320.png, implemented-frosted-harbor-393.png, implemented-frosted-harbor-430.png.
