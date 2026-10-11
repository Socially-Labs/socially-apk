export type ChartDatum = { time: number; value: number | null; label: string; segment?: string; gap?: boolean };
export type PlotPoint = ChartDatum & { x: number; y: number; value: number };

/** Plotting only: accounting and return calculations stay with the data source. */
export function chartGeometry(data: readonly ChartDatum[], width: number, height: number, {
  axes = false, includeZero = false, minimumRange = 1,
}: { axes?: boolean; includeZero?: boolean; minimumRange?: number } = {}) {
  const left = axes ? 46 : 6, right = Math.max(left + 1, width - 8), top = 10, bottom = Math.max(top + 1, height - 10);
  const times = data.map(p => p.time).filter(Number.isFinite);
  const values = data.filter(p => !p.gap && Number.isFinite(p.time) && p.value !== null && Number.isFinite(p.value)).map(p => p.value!);
  const from = times.length ? Math.min(...times) : 0, to = times.length ? Math.max(...times) : 1;
  let min = values.length ? Math.min(...values) : 0, max = values.length ? Math.max(...values) : 0;
  if (includeZero) { min = Math.min(min, 0); max = Math.max(max, 0); }
  const range = Math.max(max - min, Number.isFinite(minimumRange) && minimumRange > 0 ? minimumRange : 1);
  const middle = min + (max - min) / 2;
  min = middle - range * 0.6; max = middle + range * 0.6;
  const y = (value: number) => top + (max - value) / (max - min) * (bottom - top);
  const segments: PlotPoint[][] = [];
  let part: PlotPoint[] = [];
  for (const datum of data) {
    if (datum.gap || datum.value === null || !Number.isFinite(datum.value) || !Number.isFinite(datum.time)) {
      if (part.length) segments.push(part);
      part = []; continue;
    }
    if (part.length && part[0].segment !== datum.segment) { segments.push(part); part = []; }
    part.push({ ...datum, value: datum.value, x: to > from ? left + (datum.time - from) / (to - from) * (right - left) : (left + right) / 2, y: y(datum.value) });
  }
  if (part.length) segments.push(part);
  const baseline = includeZero ? y(0) : bottom;
  const paths = segments.map(points => {
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    return { line, fill: `${line} L${points.at(-1)!.x.toFixed(2)} ${baseline} L${points[0].x.toFixed(2)} ${baseline} Z` };
  });
  return { segments, points: segments.flat(), paths, min, max, left, right, top, bottom, zeroY: y(0) };
}

/** Coordinates are chronological; binary search avoids scanning history on each move. */
export function nearestPoint(points: readonly PlotPoint[], x: number) {
  if (!points.length) return -1;
  let low = 0, high = points.length - 1;
  while (low < high) { const middle = (low + high) >>> 1; if (points[middle].x < x) low = middle + 1; else high = middle; }
  return low > 0 && Math.abs(points[low - 1].x - x) <= Math.abs(points[low].x - x) ? low - 1 : low;
}
