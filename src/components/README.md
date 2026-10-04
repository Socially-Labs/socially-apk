# Component structure

Keep page UI in its page folder. Files in `src/app/` remain route entry points and navigator layouts.

```text
components/
  auth/                  Shared sign-in layout, coastal scene/SVG motion, brand, input panel, icons, intro context
    splash/              Splash overlay, lockup, scene, timeline, sign-in card
  home/                  Screen coordinator, header, portfolio summary, sheets, markets, popular captains
  discover/              Discovery controls, surfaces, charts, cards, carousel, filters and Captain profile sections
  crew/                  Crew screen
  wallet/                Screen coordinator, balance card, asset row, sheets and four quick actions
  settings/              Settings surface, account/session, profile editor/media, display, referral, support, policy and about sections
  shared/
    captains/            Compact Captain cards and details used by Home
    dashboard/           Voyage screen shell and details sheet
    icons/               Product symbols (vault, trading limits, risk, strategies) and native/web variants
    markets/             Token icons and market sparklines
    navigation/          App tabs, native/web entry points, floating controls
    ui/                  Themed text/views and other UI primitives
    motion.tsx           Shared press/reveal interactions
```

Keep components used by one page in that page's folder. Move UI used across pages into an appropriate `shared/` folder. Keep platform variants together and use direct imports so Metro resolves the matching platform file.

Hooks, authentication providers, and data/constants stay in `src/hooks/`, `src/auth/`, and `src/constants/`.

Screens own navigation and coordinate state shared by their sections. Keep state used by a single section with that section. The sign-in panel owns one `useEmailAuth` instance; its field, verification, and entry controls receive values and callbacks. `useSplashController` owns splash timing, authentication readiness, and lifecycle cleanup; the overlay owns layout measurements.

Keep styles with their component. Small feature-level style files hold typography and form styles genuinely reused by multiple sections. Shared profile and wallet types live outside their screen coordinators to avoid circular dependencies.

`src/constants/theme.ts` remains the public theme entry point and loads global CSS. Palette values live in `src/constants/theme/` by domain; those modules may import another domain directly but must not import the theme entry point. `discover-ui.tsx` similarly preserves existing public exports while its implementation modules remain independent of that facade.

Aim for cohesive files around 40–150 lines and review files approaching 200 lines. These are soft guidelines: split by responsibility, keep related lifecycle logic together, and never compress JSX or move an entire stylesheet merely to satisfy a line count. Structural refactors should preserve component keys, measurement wrappers, accessibility props, animation boundaries, and route behavior.
