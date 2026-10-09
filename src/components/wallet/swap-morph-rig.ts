type Point = readonly [number, number];
const line = (a: Point, b: Point) => [a[0], a[1], a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3,
  a[0] + (b[0] - a[0]) * 2 / 3, a[1] + (b[1] - a[1]) * 2 / 3, b[0], b[1]] as const;

// Three stable slots, one cubic each, on a 24-unit grid. The shaft becomes the
// check's short stroke; the upper arrowhead becomes its long stroke. The lower
// arrowhead parks on that sibling and loses paint, preventing a doubled edge.
export const swapMorphRig = {
  arrow: [line([5, 12], [19, 12]), line([13, 6], [19, 12]), line([13, 18], [19, 12])],
  check: [line([5, 12], [10, 17]), line([10, 17], [19, 7]), line([10, 17], [19, 7])],
  parkedSlot: 2, parkedHost: 1,
} as const;

export function swapMorphPath(progress: number, slot: number) {
  'worklet';
  const t = Math.max(0, Math.min(1, progress));
  const a = swapMorphRig.arrow[slot]!, b = swapMorphRig.check[slot]!;
  const c = (index: number) => t === 0 ? a[index]! : t === 1 ? b[index]! : a[index]! + (b[index]! - a[index]!) * t;
  return `M${c(0)} ${c(1)} C${c(2)} ${c(3)} ${c(4)} ${c(5)} ${c(6)} ${c(7)}`;
}
