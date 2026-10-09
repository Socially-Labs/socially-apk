# Project TODO

## Privy mobile authentication

- [ ] In [Privy Dashboard → App settings → Clients](https://dashboard.privy.io/apps?page=settings&setting=clients), select/add a mobile client for Socially and allow app identifier `com.socially.trade` and URL scheme `apk`.
- [ ] Add its Client ID to `EXPO_PUBLIC_PRIVY_CLIENT_ID` in the APK `.env`, then restart Expo. Keep the app secret only in the backend environment.
- [ ] Enable Google login in Privy if wanted; it is currently disabled. Email login is enabled.
- [ ] Validate real Android email OTP, OAuth redirects if enabled, session restoration, signup, profile persistence, logout, and account switching against the local backend. For a connected device using `http://127.0.0.1:3000`, run `adb reverse tcp:3000 tcp:3000`.

Implementation and configuration details: [Privy integration documentation](docs/privy-auth-integration-plan.md).

## Wallet funding integration

- [x] External-wallet QR requests for Solana devnet test USDC, with exact amounts and payment references.
- [x] Persistent backend detection, finalized transaction verification, shared receipt deduplication, and restart recovery.
- [x] Live available trading balance, Captain allocations, resumable deposit requests, and recent deposit history.
- [x] Ethereum, Base, Polygon, and Arbitrum shown as coming soon.
- [x] Provision local test token/treasury and verify a real 12.345678 test-USDC deposit on devnet.
- [ ] Validate QR scanning and payment from an external wallet on a physical Android device using the updated development build.
- [ ] Build and install a native development build with `react-native-share` (`RNShare`), then verify that Share on the Receive screen sends the Glacier QR image and “Hello, here is my Solana wallet address:” followed by the full address together to WhatsApp and other apps. Expo Go currently shares the image and copies the text for manually pasting as the caption; reloading Expo Go cannot add the missing native module.
- [ ] Implement outgoing wallet transfers and swaps; both are currently marked coming soon.

## Crew UI

Scope: Mock UI screens and interactions only; no backend integration or shared portfolio data work. Use sample content to demonstrate each flow.

Suggested implementation order: Join completion → Exit flow → Buy USDC / Cash out.

- [ ] Join completion: extend the existing investment review with confirmation, processing, and success screens.
- [ ] Exit flow: add partial withdrawal and Leave vault screens with amount entry, review, and status.
- [ ] Cash out: add the withdrawal UI for the existing backend payout flow. QR funding is integrated above.
- [ ] Position details: add sample owned shares, share price, and fee breakdown to the existing position sheet.
- [ ] Activity: design sample transaction rows, status badges, and transaction details.
- [ ] Notifications: add sample trade/risk alerts, withdrawal updates, and notification preferences.
- [ ] New Crew Home: design a zero-investment state with a clear first-investment action.
- [ ] Unavailable vaults: design paused/frozen states that explain which actions remain available.

- [ ] Remove the Follow/Following button from the Captain profile card/header (`src/components/discover/captain-profile-header.tsx`, test ID `captain-follow`). Remove its unused props, styles, imports, and profile wiring in `src/components/discover/captain-screen.tsx`; remove unused following state in `src/components/discover/discover-provider.tsx` and update following-related preview copy in `src/components/discover/captain-detail-sheet.tsx`. Keep the existing Save/bookmark feature and investment action.

- [ ] Crew screen: fix the leftover Crew screen that presents the Crew user as Captain.
- [ ] Later: add Captain chat and trade explanations using sample conversations and trade content.
