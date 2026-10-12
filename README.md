# Socially

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## App screenshots

Updated October 6, 2026. Captured from the running web preview at a 390 × 844 phone viewport (2× resolution). Screens use the app’s demo mode and sample data; native rendering may differ.

| Crew home | Captain home | Discover Captains |
| --- | --- | --- |
| <img src="assets/readme/screenshots/crew-home.webp" width="250" alt="Crew home with portfolio performance and Captain vaults"> | <img src="assets/readme/screenshots/captain-home.webp" width="250" alt="Captain home with assets under management and vault actions"> | <img src="assets/readme/screenshots/discover.webp" width="250" alt="Discover Captains with featured strategies and search"> |
| **Wallet** | **Captain markets** | **Settings** |
| <img src="assets/readme/screenshots/wallet.webp" width="250" alt="Wallet with sample balances, assets, and crypto actions"> | <img src="assets/readme/screenshots/markets.webp" width="250" alt="Captain markets with trading vault and token prices"> | <img src="assets/readme/screenshots/settings.webp" width="250" alt="Settings with profile, account and display tiles, invites, and support"> |

<details>
<summary>Portfolio breakdown & notifications</summary>

| Portfolio breakdown | Notifications |
| --- | --- |
| <img src="assets/readme/screenshots/crew-portfolio.webp" width="250" alt="Crew portfolio breakdown with performance chart and investment summary"> | <img src="assets/readme/screenshots/crew-notifications.webp" width="250" alt="Notifications popover with unread portfolio updates"> |

</details>

<details>
<summary>Sign-in & onboarding</summary>

| Welcome / sign-in | Returning sign-in | Choose a username |
| --- | --- | --- |
| <img src="assets/readme/screenshots/sign-in.webp" width="250" alt="Socially coastal welcome screen with a frosted email form and Google sign-in"> | <img src="assets/readme/screenshots/sign-in-panel.webp" width="250" alt="Returning sign-in screen with the shared frosted auth card"> | <img src="assets/readme/screenshots/signup-username.webp" width="250" alt="Signup username step"> |

| Choose your role |
| --- |
| <img src="assets/readme/screenshots/signup-role.webp" width="250" alt="Signup role selection between Crew and Captain"> |

</details>

<details>
<summary>Crew vaults, Captain profiles & investment preview</summary>

| Crew vaults | Captain profile | Captain holdings |
| --- | --- | --- |
| <img src="assets/readme/screenshots/crew-vaults.webp" width="250" alt="Crew vault allocations and returns"> | <img src="assets/readme/screenshots/captain-profile.webp" width="250" alt="Atlas Captain profile and performance overview"> | <img src="assets/readme/screenshots/captain-holdings.webp" width="250" alt="Captain portfolio holdings and allocations"> |
| **Captain trades** | **Join a Captain** | **Investment review** |
| <img src="assets/readme/screenshots/captain-trades.webp" width="250" alt="Captain trade history"> | <img src="assets/readme/screenshots/investment.webp" width="250" alt="Investment amount and estimated vault shares"> | <img src="assets/readme/screenshots/investment-review.webp" width="250" alt="Sample investment review with amount, shares, and fees"> |

</details>

<details>
<summary>Wallet views & receive</summary>

| Wallet vaults | Wallet activity | Receive crypto |
| --- | --- | --- |
| <img src="assets/readme/screenshots/wallet-vaults.webp" width="250" alt="Wallet vaults empty state with Discover Captains action"> | <img src="assets/readme/screenshots/wallet-activity.webp" width="250" alt="Wallet transaction activity empty state"> | <img src="assets/readme/screenshots/wallet-receive.webp" width="250" alt="Receive crypto sheet in demo mode"> |

</details>

<details>
<summary>Captain management & trading</summary>

| Manage vaults | Your Crew | Earnings |
| --- | --- | --- |
| <img src="assets/readme/screenshots/captain-manage.webp" width="250" alt="Captain vault management sheet"> | <img src="assets/readme/screenshots/captain-crew.webp" width="250" alt="Captain Crew summary"> | <img src="assets/readme/screenshots/captain-earnings.webp" width="250" alt="Captain sample performance fee earnings"> |

| Create a vault | Token chart & trade |
| --- | --- |
| <img src="assets/readme/screenshots/captain-create.webp" width="250" alt="Create a vault draft with name and strategy"> | <img src="assets/readme/screenshots/market-trade.webp" width="250" alt="SOL price chart and sample trade form"> |

</details>

<details>
<summary>Profile, account & preferences</summary>

| Edit profile | Account | Display preferences |
| --- | --- | --- |
| <img src="assets/readme/screenshots/settings-profile.webp" width="250" alt="Profile editor with banner, avatar, name, and username"> | <img src="assets/readme/screenshots/settings-account.webp" width="250" alt="Account details and sign-in settings"> | <img src="assets/readme/screenshots/settings-display.webp" width="250" alt="Display preferences and balance visibility"> |
| **Invite a friend** | **Help & support** | **About Socially** |
| <img src="assets/readme/screenshots/settings-referral.webp" width="250" alt="Invite a friend screen"> | <img src="assets/readme/screenshots/settings-support.webp" width="250" alt="Help and support screen"> | <img src="assets/readme/screenshots/settings-about.webp" width="250" alt="About Socially and app version"> |

| Terms of Service | Privacy Policy |
| --- | --- |
| <img src="assets/readme/screenshots/settings-terms.webp" width="250" alt="Terms of Service preview"> | <img src="assets/readme/screenshots/settings-privacy.webp" width="250" alt="Privacy Policy preview"> |

</details>

## Get started

### Devnet wallet and swaps

Settings → Network shows **Solana Devnet** as the default. Mainnet is coming soon. Wallet balances and the final pre-signing simulation use `https://api.devnet.solana.com`; set `EXPO_PUBLIC_SOLANA_DEVNET_RPC_URL` in `.env` to use another devnet provider. Quotes, transaction construction, broadcasting and confirmation use the authenticated backend at `EXPO_PUBLIC_API_URL`. Configure the venue with backend `SWAP_*` settings and the server devnet RPC with `SOLANA_RPC_URL`. Execution verifies the full devnet genesis hash before requesting a wallet signature.

The Assets list shows native devnet SOL and Circle faucet USDC (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`). The balance card tracks backend trading funds separately; swapping into wallet USDC does not credit that ledger automatically. Test tokens have no monetary value.

Wallet → Swap supports SOL ↔ USDC with backend Raydium devnet quotes, server validation and simulation, a prepared review with network fees and account rent, Privy signing, a final client simulation, backend submission and confirmation, and balance refresh. Quotes expire after 30 seconds, slippage is 1%, and price impact above 5% is blocked. Keep 0.01 devnet SOL for fees and account rent. Routes requiring multiple setup transactions are rejected. Public pool liquidity can change or disappear.

Request IDs are saved before preparation; intent IDs and signed transaction bytes are saved before backend submission and recovered when returning to the wallet. The backend persists signed bytes before broadcasting and retries the same transaction after crashes or lost responses. Quote expiry does not expire a prepared or landed transaction; blockhash validity and finalized chain state determine its outcome. Use **Check confirmation** or the devnet explorer link before trying another swap. No private keys are stored by the swap flow.

Run `node --test tests/solana-balance.test.mjs tests/solana-swap.test.mjs tests/swaps-api.test.mjs tests/wallet-funding.test.mjs` for the wallet checks. Native Privy signing still requires a signed-in device for end-to-end validation.

## Android APK builds

[Builds and install links](https://expo.dev/accounts/kreyon/projects/socially-trade/builds)

The EAS workflow in `.eas/workflows/preview.yml` builds a signed, standalone APK
for each push to `main`. It includes the JavaScript from that commit and does not
need Expo Go or a running Metro server. Typecheck and lint must pass before native
compilation. New pushes cancel older workflow runs for the same branch.

One-time setup:

1. In [EAS GitHub settings](https://expo.dev/accounts/kreyon/projects/socially-trade/github),
   connect `Socially-Labs/socially-apk` through the Expo GitHub app. Linking the
   local project with `eas init` alone does not enable push triggers.
2. Configure the EAS `preview` environment with `EXPO_PUBLIC_API_URL`,
   `EXPO_PUBLIC_PRIVY_APP_ID`, and `EXPO_PUBLIC_PRIVY_CLIENT_ID`. Keep
   `EXPO_PUBLIC_API_FOLLOW_METRO=false` and `EXPO_PUBLIC_AUTH_PREVIEW=false`.
   The preview backend is `https://api.socially.trade`. Local `.env` values are
   not committed and are not available to GitHub builds.
   Android push notifications additionally need a `GOOGLE_SERVICES_JSON` file
   variable and FCM credentials; they are optional for building the APK.
3. Configure Android signing once:

   ```bash
   npx eas-cli@latest credentials:configure-build --platform android --profile preview
   ```

   Generate a keystore or select the existing one. Keep that same signing key for
   subsequent APKs and download a secure backup using `eas credentials`. EAS can
   manage the key; generating it yourself is not required for future store use.
4. Commit the build configuration and push it to `main`.

GitHub linking can be completed later. For a manual APK build without it:

```bash
npx eas-cli@latest build --platform android --profile preview
```

`.easignore` excludes design previews and other files unnecessary for compilation
from local build uploads.

To validate or run the workflow manually:

```bash
npx eas-cli@latest workflow:validate .eas/workflows/preview.yml --non-interactive
npx eas-cli@latest workflow:run .eas/workflows/preview.yml
```

Open a finished build in the builds page, copy its install link, and share it with
testers or hackathon judges. Testers download the APK, allow their browser to
install apps when Android asks, and install it. Each build has its own link;
keep the submission's link pointing to the exact APK you want judges to review.
Confirm unauthenticated access to internal builds is enabled if judges should
install without an Expo account. Install newer APKs over the old app to retain
data: the package and signing key must remain the same. Remote version codes
increment for every build via `autoIncrement: true`.

Each fresh APK consumes an EAS build from the account's allowance. Fingerprint
reuse alone would serve an older JS bundle because this app has no OTA updater.

The `production` profile creates an AAB for future Google Play submission:

```bash
npx eas-cli@latest build --platform android --profile production
```

Configure the separate EAS `production` environment before using it. AABs are
store upload artifacts; share the `preview` APK for direct installation.

### Run locally

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

Captain market discovery is gated by `EXPO_PUBLIC_MARKET_DISCOVERY_V1_ENABLED`. See [the API contract](../backend/docs/market-discovery-api.md) and [rollout evidence](../backend/docs/paper-trading-discovery-implementation.md) before enabling it.

When enabled, Captain Discover opens Jupiter **Top traded · 24H**. Supported, Trending, Invested and Saved remain available in the feed picker. The API's parameterless default remains Supported for compatibility. Restart/reload Expo after changing the public flag.

Discover uses cursor-based infinite scrolling in batches of ten. The first batch
shows token names and prices as soon as metadata arrives; cached charts load
independently and chart failures never hide the catalog. Scrolling to the bottom
loads the next batch with an inline spinner;
there are no page controls. Already displayed rows remain visible during loading
or a failed append. Retries do not duplicate rows, and background catalog refreshes
do not replace an expanded snapshot with page one. Refresh markets explicitly
starts a new snapshot.

Public catalog pages are coalesced and cached for 15–60 seconds per API instance;
chart batches for 30 seconds with a bounded 16-batch cache. Visible rows subscribe
to the existing price stream without individual tracking/token/history HTTP polls.
Tracking and Birdeye backfill begin when the trade sheet opens. Market charts show
the past 24 hours only; unavailable history produces an explicit empty state and
does not hold the loader open. Token icons keep their existing memory/disk cache
and fallback while remote images load. See
[24-hour chart configuration and limits](../backend/docs/market-charts.md).

The existing Discover trade sheet registers the selected mint on opening, retains
its instrument identity between 15-second tracking lease renewals, and refreshes
its executable price and selected-instrument vault limits every five seconds while
visible. Buy and Sell use the selected vault's authenticated preview, submission
and order-status routes; current vault rounds use `/v1/vaults/:id/...`. Discovery
metadata prices cannot enable submission. Cancelled/completed vaults, fundraising
locks and legacy token allowlists remain enforced, with a vault-selector action
when a different trading vault is needed. `pnpm test:market-api` covers this wiring,
warming recovery, native abort signals and eligibility explanations.
