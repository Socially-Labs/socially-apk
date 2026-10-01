# Component structure

Keep page UI in its page folder. Files in `src/app/` remain route entry points and navigator layouts.

```text
components/
  auth/                  Sign-in screen, brand, input panel, icons, intro context
    splash/              Splash screen, scene, timeline, sign-in card
  home/                  Home screen, staked markets, popular captains section
  discover/              Discover screen and captain search
  crew/                  Crew screen
  wallet/                Wallet screen and deposit/withdraw actions
  settings/              Account settings screen
  shared/
    captains/            Captain cards and details used by Home and Discover
    dashboard/           Screen shell and details sheet
    icons/               Shared icons, including native/web variants
    markets/             Token icons and market sparklines
    navigation/          App tabs, native/web entry points, floating controls
    ui/                  Themed text/views and other UI primitives
    motion.tsx           Shared press/reveal interactions
```

Keep components used by one page in that page's folder. Move UI used across pages into an appropriate `shared/` folder. Keep platform variants together and use direct imports so Metro resolves the matching platform file.

Hooks, authentication providers, and data/constants stay in `src/hooks/`, `src/auth/`, and `src/constants/`.
