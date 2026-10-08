type Point = readonly [number, number];
const line = (a: Point, b: Point) => [a[0], a[1], a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3,
  a[0] + (b[0] - a[0]) * 2 / 3, a[1] + (b[1] - a[1]) * 2 / 3, b[0], b[1]] as const;
const check = [line([5, 12], [7.5, 14.5]), line([7.5, 14.5], [10, 17]), line([10, 17], [14.5, 12.5]), line([14.5, 12.5], [19, 8])];

// Two authored slots, four cubics each. The front outline unfolds into the
// check. The rear copy outline parks on that same check and loses its paint.
export const copyMorphRig = {
  front: [line([8, 7], [20, 7]), line([20, 7], [20, 21]), line([20, 21], [8, 21]), line([8, 21], [8, 7])],
  rear: [line([9, 3], [5, 3]), [5, 3, 3.8954, 3, 3, 3.8954, 3, 5], line([3, 5], [3, 15]), [3, 15, 3, 16.1046, 3.8954, 17, 5, 17]],
  check,
  parkedHost: 'front',
} as const;

export function copyMorphPath(progress: number, slot: 'front' | 'rear') {
  'worklet';
  const t = Math.min(1, Math.max(0, progress));
  const from = copyMorphRig[slot], to = copyMorphRig.check;
  let path = '';
  for (let segment = 0; segment < 4; segment++) {
    const a = from[segment]!, b = to[segment]!;
    const coordinate = (n: number) => t === 0 ? a[n]! : t === 1 ? b[n]! : a[n]! + (b[n]! - a[n]!) * t;
    if (!segment) path = `M${coordinate(0)} ${coordinate(1)}`;
    path += ` C${coordinate(2)} ${coordinate(3)} ${coordinate(4)} ${coordinate(5)} ${coordinate(6)} ${coordinate(7)}`;
  }
  return path;
}
