# Socially logo formats

Converted from the existing `assets/images/splash-icon.png` and `android-icon-foreground.png`. The pirate, three candlesticks, proportions, and silver-blue palette come from those files. No new logo was generated. Existing application assets and configuration remain unchanged.

Open **preview.html** to compare the original with the vector trace using the slider.

## Choosing an SVG

| File | What it contains | Appropriate use |
| --- | --- | --- |
| `logo.svg` | True editable vector paths; sampled color layers and a vector alpha mask. No bitmap, fonts, or external dependencies. | Vector editors, scaling, and artwork workflows. |
| `logo-exact.svg` | The **original PNG bytes**, embedded in a self-contained SVG. | Exact original appearance when an SVG file is required. This is **not** resolution-independent vector artwork. |
| `android-foreground-exact.svg` | The original Android foreground PNG embedded losslessly, including its existing padding. | Exact foreground reference. |
| `emblem-monochrome.svg` | Compact vector silhouette traced from the existing Android monochrome asset; uses `currentColor`. | Single-color rendering. Retains the existing adaptive icon's placement. |
| `logo.svgz` | Gzip-compressed `logo.svg`. | Tools that support compressed SVG. |

**Fidelity:** the source is textured raster artwork. The vector trace closely preserves the visible design, but its texture, color sampling, and antialiased boundaries are approximations. It is not pixel-identical. The exact SVG embeds a byte-identical PNG; this is verified by SHA-256. `fidelity-report.json` records the vector render's actual error, including its largest edge differences, rather than claiming perfection.

The detailed vector trace is about 6 MB because it preserves many shading contours. Prefer the existing PNGs or the lossless WebP for runtime mobile UI. Keep the full vector as an artwork asset. Some restricted SVG consumers do not support masks; the bitmap exports are available for those consumers.

## Other formats

| File | Size / purpose |
| --- | --- |
| `logo.png` | 1024 × 1024; byte-identical transparent source. |
| `logo.webp` | 1024 × 1024; lossless with transparency; decoded visible pixels verified against the source. |
| `logo.avif` | 1024 × 1024; lossless with transparency; decoded visible pixels verified against the source. |
| `logo.jpeg` | 1024 × 1024; quality 100, 4:4:4, flattened onto `#D6E0E8`. JPEG has no transparency and is lossy. |
| `favicon.ico` | Seven sizes: 16, 24, 32, 48, 64, 128, 256. Small frames use 32-bit DIB; larger frames use PNG. |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Transparent browser icon sizes. |
| `apple-touch-icon.png` | 180 × 180, opaque. |
| `icon-192.png`, `icon-512.png` | Opaque standard web-app icons. These are not maskable variants. |
| `app-icon-1024.png` | Byte-identical copy of the existing opaque app icon. |
| `logo-vector-preview.png` | 1024 × 1024 render of `logo.svg` for comparison. |

All raster sizes are exported from the original PNG, avoiding cumulative resizing and avoiding changes introduced by tracing. These are optional exports; the app continues using its existing configured launcher and splash files.

## Rebuild

Run from the repository root. Conversion tools are isolated outside the application's dependencies:

```sh
npm install --prefix /private/tmp/socially-logo-tools --no-save --package-lock=false sharp@0.35.5 potrace@2.1.8 @resvg/resvg-js@2.6.2
NODE_PATH=/private/tmp/socially-logo-tools/node_modules node scripts/export-brand-assets.cjs
```

The generator verifies source hashes, the absence of embedded images in the vector SVG, visible-pixel equality for lossless formats, and the vector rendering error. It rewrites the generated assets and fidelity report. The preview and this document are maintained separately.
