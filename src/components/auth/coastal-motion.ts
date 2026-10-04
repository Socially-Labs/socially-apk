/** All artwork and SVG layers use the same source coordinates. */
export const COASTAL_ART = { width: 941, height: 1672 } as const;
export const COASTAL_BOAT = { x: 697, y: 620, width: 130, height: 202 } as const;

/** Preserve the seated figure above the form without stretching the image. */
export function coastalFrame(width: number, height: number) {
  const scale = Math.min(width, 640) / COASTAL_ART.width;
  return {
    scale,
    width: COASTAL_ART.width * scale,
    height: COASTAL_ART.height * scale,
    left: (width - COASTAL_ART.width * scale) / 2,
    top: Math.min(0, height - 350 - 1100 * scale),
  };
}

export function coastalBoatMotion(time: number) {
  'worklet';
  const turn = Math.PI * 2;
  return {
    x: 7 * Math.sin(time / 24000 * turn),
    y: 1.7 * Math.sin(time / 6000 * turn),
    roll: 0.35 * Math.sin(time / 8000 * turn),
  };
}

// This edge follows the outside of the person, boots and limestone. Every water
// overlay is clipped here; the raster foreground never translates or distorts.
export const COASTAL_WATER = 'M430 820 L941 820 L941 1550 L0 1550 L0 1402 C150 1422 362 1405 485 1366 L523 1325 L535 1295 L573 1268 L581 1247 L585 1225 L603 1223 L592 1194 L590 1164 L568 1131 L538 1102 L490 1082 L466 1068 L454 1018 L430 976 L420 940 Z';
