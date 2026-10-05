# Crew UI TODO

Scope: Mock UI screens and interactions only; no backend integration or shared portfolio data work. Use sample content to demonstrate each flow.

Suggested implementation order: Join completion → Exit flow → Buy USDC / Cash out.

- [ ] Join completion: extend the existing investment review with confirmation, processing, and success screens.
- [ ] Exit flow: add partial withdrawal and Leave vault screens with amount entry, review, and status.
- [ ] Wallet funding: build Buy USDC and Cash out screens in place of connection placeholders.
- [ ] Position details: add sample owned shares, share price, and fee breakdown to the existing position sheet.
- [ ] Activity: design sample transaction rows, status badges, and transaction details.
- [ ] Notifications: add sample trade/risk alerts, withdrawal updates, and notification preferences.
- [ ] New Crew Home: design a zero-investment state with a clear first-investment action.
- [ ] Unavailable vaults: design paused/frozen states that explain which actions remain available.

- [ ] Remove the Follow/Following button from the Captain profile card/header (`src/components/discover/captain-profile-header.tsx`, test ID `captain-follow`). Remove its unused props, styles, imports, and profile wiring in `src/components/discover/captain-screen.tsx`; remove unused following state in `src/components/discover/discover-provider.tsx` and update following-related preview copy in `src/components/discover/captain-detail-sheet.tsx`. Keep the existing Save/bookmark feature and investment action.

- [ ] Crew screen: fix the leftover Crew screen that presents the Crew user as Captain.
- [ ] Later: add Captain chat and trade explanations using sample conversations and trade content.
