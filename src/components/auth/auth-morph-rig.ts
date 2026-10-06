type Point = readonly [number, number];
type Cubic = readonly number[];
const line = (a: Point, b: Point): Cubic => [a[0], a[1], a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3,
  a[0] + (b[0] - a[0]) * 2 / 3, a[1] + (b[1] - a[1]) * 2 / 3, b[0], b[1]];
const rectangle = (left: number, top: number, right: number, bottom: number) => [
  line([left, top], [right, top]), line([right, top], [right, bottom]),
  line([right, bottom], [left, bottom]), line([left, bottom], [left, top]),
];

// Two stable slots: the surrounding frame and its meaningful interior stroke.
// Every state uses four frame cubics and two interior cubics, with identical traversal.
export const authMorphRig = [
  { frame: rectangle(3, 6, 21, 19), mark: [line([3, 7], [12, 13]), line([12, 13], [21, 7])] },
  { frame: rectangle(6, 10, 18, 21), mark: [[8, 10, 8, 5, 8, 4, 12, 4], [12, 4, 16, 4, 16, 5, 16, 10]] },
  { frame: [
    [12, 2, 17.5228, 2, 22, 6.4772, 22, 12], [22, 12, 22, 17.5228, 17.5228, 22, 12, 22],
    [12, 22, 6.4772, 22, 2, 17.5228, 2, 12], [2, 12, 2, 6.4772, 6.4772, 2, 12, 2],
  ], mark: [line([7, 12], [10.5, 15.5]), line([10.5, 15.5], [17, 8.5])] },
] as const;

export function authMorphPath(position: number, slot: 'frame' | 'mark') {
  'worklet';
  const p = Math.min(2, Math.max(0, position));
  const index = Math.min(1, Math.floor(p));
  const t = p - index;
  const from = authMorphRig[index]![slot], to = authMorphRig[index + 1]![slot];
  let path = '';
  for (let segment = 0; segment < from.length; segment++) {
    const a = from[segment]!, b = to[segment]!;
    const coordinate = (n: number) => a[n]! + (b[n]! - a[n]!) * t;
    if (segment === 0) path = `M${coordinate(0)} ${coordinate(1)}`;
    path += ` C${coordinate(2)} ${coordinate(3)} ${coordinate(4)} ${coordinate(5)} ${coordinate(6)} ${coordinate(7)}`;
  }
  return path;
}
