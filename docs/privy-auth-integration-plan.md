# Privy authentication and unified account integration

Updated 2026-10-06. Backend account integration is implemented. Actual Android OTP/OAuth login still needs a configured Privy mobile app client and device validation.

## Account design

One `users` row owns identity, username, role, profile and paper balance. Fields:
`id`, `auth_subject`, `display_name`, `username`, `role`, `bio`, `avatar_url`,
`banner_url`, `paper_cash`, `created_at`.

`username` and `role` are both null before signup and both populated afterwards.
Role is `crew` or `captain`. There is no `onboarding_completed_at` or separate
Captain profile table. Migration 017 preserves existing Captain handles, images,
fund ownership and uploads. Existing Crew accounts select their globally unique
username during signup; device-local names are not silently claimed.

See [backend schema and endpoint contracts](../../backend/docs/unified-user-accounts.md)
and [migration 017](../../backend/packages/db/migrations/017_unified_users.sql).

## Implemented API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/v0/auth/privy` | Verify current Privy token, bootstrap account once |
| GET | `/v0/me` | Restore full server account and exact paper balance |
| GET | `/v0/users/username-availability?username=...` | Public shared Crew/Captain availability |
| POST | `/v0/me/onboarding` | Atomically claim username and role |
| PATCH | `/v0/me` | Save name, username, role, bio and owned images |
| POST | `/v0/me/assets/uploads` | Prepare signed image upload |
| POST | `/v0/me/assets/uploads/:uploadId/complete` | Verify/publish upload before profile save |

Protected endpoints use `Authorization: Bearer <current Privy access token>`.
Account DTO: `{id,displayName,username,role,bio,avatarUrl,bannerUrl,mode:"PAPER",paperCash:{value,asset:"USDC"}}`.
Balances are decimal strings. User IDs, balances and approval state cannot be set
through profile requests. New usernames are 3–24 lowercase letters/digits/underscores,
starting with a letter; unchanged legacy Captain handles remain valid.

Both roles share the Redis Bloom filter and SQL unique username constraint.
Synchronized Bloom negatives avoid username lookups; positives confirm in SQL.
Stale/missing/unavailable Redis falls back to SQL. Username conflicts return 409.
Existing Captain endpoints remain compatibility aliases over `users`.

## Mobile wiring

- Native/web SDK bridges expose their mounted `getAccessToken` getter.
- [API client](../src/api/client.ts) validates configuration and DTOs, bounds request
  timeouts, supports cancellation and retries one authentication failure.
- [Account store](../src/api/account-store.ts) bootstraps then fetches `/v0/me`;
  logout/account switching cancels requests and discards late responses.
- [Account provider](../src/auth/backend-account-provider.tsx) exposes server state.
- Protected navigation requires the current server account and completed signup.
  Connectivity failures offer retry/signout. Signup and profile edits persist through
  the API. Local preferences still control device-only settings.
- Profile uploads use prepare → signed PUT → completion → PATCH profile. Native
  file bodies use Expo File/fetch; storage PUTs receive no Privy bearer token.
- Auth preview requires an explicit development flag and is disabled by default.

## Local development

Backend commands load its root `.env`:

```sh
cd ../backend
docker compose up -d postgres redis
pnpm build
pnpm db:migrate
pnpm dev:api
```

Use local PostgreSQL/Redis, `PORT=3000`, the matching `PRIVY_APP_ID`, and exact
Expo web origins in `CORS_ORIGINS`. Leave `USDG_MINT` unset for this PAPER flow.
Keep `PRIVY_APP_SECRET` only in backend configuration.

APK `.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
EXPO_PUBLIC_PRIVY_APP_ID=cmuohe4xj000z0ci9swx69t5b
EXPO_PUBLIC_PRIVY_CLIENT_ID=<mobile-client-id-from-dashboard>
EXPO_PUBLIC_AUTH_PREVIEW=false
```

For a connected Android device/emulator: `adb reverse tcp:3000 tcp:3000`.
Without reverse, Android emulator host access uses `http://10.0.2.2:3000`;
a physical device needs the computer's reachable LAN address. Restart Expo after
changing public environment variables.

## Verified Privy configuration and remaining setup

The live public app configuration was checked on 2026-10-06 using the provided
app ID. It reports `email_auth=true`, `google_oauth=false`, and empty app-level
`allowed_native_app_ids` and `allowed_native_app_url_schemes`. It does not expose
mobile clients or their IDs; client-specific overrides have not been inspected.
The installed SDK's API types likewise expose public app settings, with no
app-client management/list method. No documented client-list API was found.
An app ID or server app secret cannot substitute for the mobile Client ID.

[Privy's mobile setup docs](https://docs.privy.io/basics/react-native/setup)
require an app client. Open [Configuration → App settings → Clients](https://dashboard.privy.io/apps?page=settings&setting=clients),
select this app, and add/select a mobile client. Configure:

- Allowed app identifier: `com.socially.trade` (from `app.config.ts`).
- Allowed URL scheme: `apk` (from `app.json`).
- Copy its Client ID to `EXPO_PUBLIC_PRIVY_CLIENT_ID`.
- Enable Google under login methods if Google login is wanted.

[App-client documentation](https://docs.privy.io/basics/get-started/dashboard/app-clients)
explains mobile allowlists and redirect schemes. This setup requires dashboard
access; public app configuration cannot recover a mobile Client ID. No Android
device was attached during validation, so actual OTP, OAuth redirects and native
session restoration have not been exercised.

## Validation

App lint and TypeScript checks pass; 16 account/auth unit tests pass. The durable
[test over HTTP](../tests/backend-http-integration.test.mjs) passes against the real
backend with locally signed test tokens and mock JWKS, covering both roles,
restoration, profile edits, username conflicts, account switching and a single grant.
Web and Android JavaScript exports pass. Browser checks confirm sign-in rendering,
public availability and authenticated JSON preflight access to the local API.
These checks do not replace a signed APK build or actual Privy login on a device.

Backend build and typechecks pass. All 117 backend tests pass on the final run,
including account, migration, authorization, concurrency, Bloom and financial
regressions. An earlier freshness/settlement run failed; the standalone financial
suite and subsequent full run both passed without code changes. Tests use random schemas in
isolated local PostgreSQL and isolated Redis filter namespaces. Re-run with:

```sh
# backend root
TEST_DATABASE_URL=postgres://integration:integration@127.0.0.1:55432/integration TEST_REDIS_URL=redis://127.0.0.1:56379 node --test apps/api/test/*.test.mjs

# APK root
npm run lint
npm run typecheck
npm run test:account
npm run test:auth
TEST_DATABASE_URL=postgres://integration:integration@127.0.0.1:55432/integration npm run test:integration
```
