export type SplashPhase = 'mirroring' | 'unveiling' | 'performing' | 'waiting' | 'leaving' | 'gone';
export type SplashEvent = 'mirrorPainted' | 'nativeHidden' | 'performed' | 'authenticated' | 'left';

const EDGES: Readonly<Record<SplashPhase, { on: SplashEvent; to: SplashPhase } | null>> = {
  mirroring: { on: 'mirrorPainted', to: 'unveiling' },
  unveiling: { on: 'nativeHidden', to: 'performing' },
  performing: { on: 'performed', to: 'waiting' },
  // Signed-out visitors stay on the animated scene until the sign-in card succeeds.
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
  readonly exit: Cue;
  readonly exitAt: number;
  readonly end: number;
};

export function buildTimeline({ reduceMotion }: { reduceMotion: boolean }): Timeline {
  const exitAt = reduceMotion ? 400 : 1200;
  const end = exitAt + (reduceMotion ? 180 : 450);
  return {
    reduceMotion,
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
