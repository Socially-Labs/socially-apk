type Cubic = readonly [number, number, number, number, number, number, number, number];
type Contour = readonly Cubic[];

// Stable cubic slots and winding: the sails billow without changing topology.
// The mast remains connected; the hull never collapses or parks on a sail.
export const harbourBoatRig = {
  mainsail: [
    [[29, 5, 25, 16, 19, 27, 11, 34], [11, 34, 17, 34, 23, 34, 29, 34], [29, 34, 29, 24, 29, 14, 29, 5]],
    [[29, 5, 29, 17, 24, 29, 14, 34], [14, 34, 19, 35, 24, 35, 29, 34], [29, 34, 30, 24, 30, 14, 29, 5]],
  ],
  foresail: [
    [[32, 9, 39, 17, 43, 25, 45, 34], [45, 34, 41, 33, 36, 33, 32, 34], [32, 34, 32, 25, 32, 17, 32, 9]],
    [[32, 9, 43, 16, 48, 26, 47, 34], [47, 34, 42, 35, 36, 35, 32, 34], [32, 34, 32, 25, 32, 17, 32, 9]],
  ],
  hull: [
    [[9, 38, 23, 38, 40, 38, 52, 38], [52, 38, 49, 44, 42, 47, 32, 47], [32, 47, 21, 47, 14, 44, 9, 38]],
    [[9, 38, 23, 37, 40, 37, 52, 38], [52, 38, 48, 43, 41, 46, 31, 46], [31, 46, 21, 46, 14, 43, 9, 38]],
  ],
} as const satisfies Record<string, readonly [Contour, Contour]>;

export type HarbourBoatSlot = keyof typeof harbourBoatRig;

function contourPath(progress: number, from: Contour, to: Contour) {
  'worklet';
  const t = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  let path = '';
  for (let i = 0; i < from.length; i++) {
    const a = from[i]!, b = to[i]!;
    const n = (index: number) => t === 0 ? a[index]! : t === 1 ? b[index]! : a[index]! + (b[index]! - a[index]!) * t;
    if (i === 0) path = `M${n(0)} ${n(1)}`;
    path += ` C${n(2)} ${n(3)} ${n(4)} ${n(5)} ${n(6)} ${n(7)}`;
  }
  return `${path} Z`;
}

export function harbourBoatPath(progress: number, slot: HarbourBoatSlot) {
  'worklet';
  return contourPath(progress, harbourBoatRig[slot][0], harbourBoatRig[slot][1]);
}

// Broad decorative water contours with two matched cubics per layer.
export const harbourWaterRig = [
  [
    [[0, 17, 65, 4, 100, 3, 180, 17], [180, 17, 245, 31, 300, 2, 360, 12]],
    [[0, 13, 65, 26, 115, 2, 180, 10], [180, 10, 255, 25, 305, 8, 360, 17]],
  ],
  [
    [[0, 21, 65, 10, 120, 28, 180, 23], [180, 23, 245, 8, 300, 25, 360, 20]],
    [[0, 23, 65, 15, 120, 8, 180, 18], [180, 18, 245, 30, 300, 12, 360, 23]],
  ],
] as const satisfies readonly (readonly [Contour, Contour])[];

export function harbourWaterPath(progress: number, layer: 0 | 1) {
  'worklet';
  const [from, to] = harbourWaterRig[layer];
  return contourPath(progress, from, to).replace(' Z', ' L360 30 L0 30 Z');
}
