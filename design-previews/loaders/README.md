# Socially loader concepts

Five PNG mockups generated with the built-in image generation tool; full prompt set in [prompts.json](./prompts.json).

| Concept | Preview | Animated SVG | Motion |
| --- | --- | --- | --- |
| 01 · Tidal mark (recommended) | [PNG](./01-tidal-mark.png) | [SVG](./01-tidal-mark.svg) | Staggered wave drawing, 1.6s |
| 02 · North compass | [PNG](./02-north-compass.png) | [SVG](./02-north-compass.svg) | Needle turns and settles, 2s |
| 03 · Sailing home | [PNG](./03-sailing-home.png) | [SVG](./03-sailing-home.svg) | Gentle boat rocking and wave movement, 1.8s |
| 04 · Vault dial | [PNG](./04-vault-dial.png) | [SVG](./04-vault-dial.svg) | Continuous dial rotation, 1.8s |
| 05 · Crew orbit | [PNG](./05-crew-orbit.png) | [SVG](./05-crew-orbit.svg) | Emphasis moves between people, 1.5s |

SVGs are transparent, hand-authored vector motion prototypes. Open in a browser to see animation. Each uses a 64×64 viewBox and can render at 24–64px. Reduced-motion preference stops animation.

For the APK, reuse the paths in react-native-svg and drive the motion with the project's Reanimated setup; embedded CSS animations are browser previews and do not run directly in react-native-svg. No production screens or navigation were changed.
