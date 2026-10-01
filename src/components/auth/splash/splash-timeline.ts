export type SplashPhase = 'mirroring' | 'unveiling' | 'performing' | 'waiting' | 'leaving' | 'gone';
export type SplashEvent = 'mirrorPainted' | 'nativeHidden' | 'performed' | 'authenticated' | 'left';

const EDGES: Readonly<Record<SplashPhase, { on: SplashEvent; to: SplashPhase } | null>> = {
  mirroring: { on: 'mirrorPainted', to: 'unveiling' },
  unveiling: { on: 'nativeHidden', to: 'performing' },
  performing: { on: 'performed', to: 'waiting' },
  // Signed-out visitors stay on the held scene until the sign-in card succeeds.
  waiting: { on: 'authenticated', to: 'leaving' },
  leaving: { on: 'left', to: 'gone' },
  gone: null,
};

export function transition(phase: SplashPhase, event: SplashEvent): SplashPhase {
  const edge = EDGES[phase];
  return edge !== null && edge.on === event ? edge.to : phase;
}

export function traitsOf(phase: SplashPhase) {
  return {
    pointerEvents: phase === 'gone' ? ('none' as const) : ('auto' as const),
    render: phase !== 'gone',
  };
}

type Ease = 'linear' | 'inOutCubic' | 'outCubic';
export type Cue = { readonly from: number; readonly to: number; readonly ease: Ease };
export type Timeline = {
  readonly reduceMotion: boolean;
  readonly blend: Cue;
  readonly voyage: Cue;
  readonly exit: Cue;
  readonly exitAt: number;
  readonly end: number;
};

export function buildTimeline({ reduceMotion }: { reduceMotion: boolean }): Timeline {
  const exitAt = reduceMotion ? 700 : 2900;
  const end = exitAt + (reduceMotion ? 180 : 450);
  return {
    reduceMotion,
    blend: { from: 400, to: 560, ease: 'outCubic' },
    voyage: { from: 400, to: end, ease: 'inOutCubic' },
    exit: { from: exitAt, to: end, ease: 'linear' },
    exitAt,
    end,
  };
}

export function progress(t: number, cue: Cue): number {
  'worklet';
  if (cue.to <= cue.from) return t >= cue.from ? 1 : 0;
  const x = Math.min(1, Math.max(0, (t - cue.from) / (cue.to - cue.from)));
  switch (cue.ease) {
    case 'linear': return x;
    case 'outCubic': return 1 - (1 - x) ** 3;
    case 'inOutCubic': return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2;
  }
}

/** All layer coordinates refer to the supplied image, never to a particular phone. */
export const SCENE = { width: 841, height: 1871 } as const;
export const WATER_PLATE = { x: 496, y: 816, width: 224, height: 566 } as const;
export const BOAT = { x: 493, y: 831, width: 172, height: 310 } as const;
export const REFLECTION = { x: 485, y: 1140, width: 190, height: 236 } as const;
export const REFLECTION_BANDS = 12;
export const REFLECTION_LAG_MS = 120;

/** Same centered cover calculation as expo-image, shared by every layer. */
export function sceneFrame(width: number, height: number) {
  const scale = Math.max(width / SCENE.width, height / SCENE.height);
  return {
    scale,
    width: SCENE.width * scale,
    height: SCENE.height * scale,
    left: (width - SCENE.width * scale) / 2,
    top: (height - SCENE.height * scale) / 2,
  };
}

export function boatMotion(t: number, timeline: Timeline, travel = 18) {
  'worklet';
  if (timeline.reduceMotion) return { x: 0, y: 0, roll: 0 };
  const elapsed = Math.max(0, Math.min(t, timeline.end) - timeline.voyage.from);
  if (elapsed === 0) return { x: 0, y: 0, roll: 0 };
  const envelope = Math.min(1, elapsed / 700);
  return {
    x: travel * progress(t, timeline.voyage),
    // Both the value and velocity start at zero; one shallow bob, no loop.
    y: -1.5 * (1 - Math.cos((elapsed / 6000) * Math.PI * 2)),
    roll: 0.12 * envelope * Math.sin((elapsed / 7000) * Math.PI * 2),
  };
}

/** Distort the existing reflection in narrow bands, without animating other water. */
export function reflectionMotion(t: number, timeline: Timeline, band: number, travel = 18) {
  'worklet';
  const boat = boatMotion(t - REFLECTION_LAG_MS, timeline, travel);
  if (timeline.reduceMotion) return { x: 0, y: 0 };
  const elapsed = Math.max(0, Math.min(t, timeline.end) - timeline.voyage.from - REFLECTION_LAG_MS);
  if (elapsed === 0) return { x: 0, y: 0 };
  const envelope = Math.min(1, elapsed / 800);
  const depth = (band + 1) / REFLECTION_BANDS;
  const wave = Math.sin((elapsed / 3400) * Math.PI * 2 - band * 0.65);
  return {
    x: boat.x + envelope * depth * wave * 0.9,
    y: -boat.y * 0.08 + envelope * depth * wave * 0.15,
  };
}
