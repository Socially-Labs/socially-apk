type Point = readonly [number, number];
const line = (a: Point, b: Point) => [a[0], a[1], a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3,
  a[0] + (b[0] - a[0]) * 2 / 3, a[1] + (b[1] - a[1]) * 2 / 3, b[0], b[1]] as const;
const down = [line([6, 6], [10, 10]), line([10, 10], [14, 14]), line([14, 14], [18, 18])];
const up = [line([18, 6], [14, 10]), line([14, 10], [10, 14]), line([10, 14], [6, 18])];

// Each bell shoulder unfolds into one diagonal. All slots have three cubics;
// the clapper parks on the first diagonal and loses its paint independently.
const rig = {
  left: { bell: [[12, 3, 8.686, 3, 6, 5.686, 6, 9], [6, 9, 6, 14, 4.5, 15.5, 3, 17], line([3, 17], [12, 17])], cross: down },
  right: { bell: [[12, 3, 15.314, 3, 18, 5.686, 18, 9], [18, 9, 18, 14, 19.5, 15.5, 21, 17], line([21, 17], [12, 17])], cross: up },
  clapper: { bell: [[10, 20, 10.2, 20.8, 10.7, 21.4, 11.3, 21.6], [11.3, 21.6, 11.7, 21.75, 12.3, 21.75, 12.7, 21.6], [12.7, 21.6, 13.3, 21.4, 13.8, 20.8, 14, 20]], cross: down },
} as const;

export function notificationBellPath(progress: number, slot: keyof typeof rig) {
  'worklet';
  const t = Math.min(1, Math.max(0, progress));
  const { bell, cross } = rig[slot];
  let path = '';
  for (let segment = 0; segment < 3; segment++) {
    const a = bell[segment]!, b = cross[segment]!;
    const coordinate = (n: number) => a[n]! + (b[n]! - a[n]!) * t;
    if (!segment) path = `M${coordinate(0)} ${coordinate(1)}`;
    path += ` C${coordinate(2)} ${coordinate(3)} ${coordinate(4)} ${coordinate(5)} ${coordinate(6)} ${coordinate(7)}`;
  }
  return path;
}
