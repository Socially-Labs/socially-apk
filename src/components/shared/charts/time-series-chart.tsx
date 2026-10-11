import { memo, useCallback, useId, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { InterFont } from '@/constants/fonts';
import { CaptainHomePalette as C } from '@/constants/theme';
import { chartGeometry, nearestPoint, type ChartDatum } from './chart-geometry';

type Geometry = ReturnType<typeof chartGeometry>;
const axisPercent = (value: number) => `${value > 0 ? '+' : ''}${Number(value.toFixed(Math.abs(value) < 0.01 ? 6 : Math.abs(value) < 1 ? 4 : 2))}%`;
const Plot = memo(function Plot({ geometry: g, width, height, color, id, axes, grid }: {
  geometry: Geometry; width: number; height: number; color: string; id: string; axes: boolean; grid: boolean;
}) {
  const zeroVisible = g.zeroY >= g.top && g.zeroY <= g.bottom;
  const ticks = [{ value: zeroVisible && Math.abs(g.zeroY - g.top) < 14 ? 0 : g.max, y: zeroVisible && Math.abs(g.zeroY - g.top) < 14 ? g.zeroY : g.top },
    { value: zeroVisible && Math.abs(g.zeroY - g.bottom) < 14 ? 0 : g.min, y: zeroVisible && Math.abs(g.zeroY - g.bottom) < 14 ? g.zeroY : g.bottom },
    ...(zeroVisible && Math.abs(g.zeroY - g.top) >= 14 && Math.abs(g.zeroY - g.bottom) >= 14 ? [{ value: 0, y: g.zeroY }] : [])];
  return <Svg width={width} height={height}>
    <Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity={0.15} /><Stop offset="1" stopColor={color} stopOpacity={0} /></LinearGradient></Defs>
    {grid ? [g.top, g.bottom].map(y => <Line key={y} x1={g.left} x2={g.right} y1={y} y2={y} stroke={C.line} strokeWidth={0.7} />) : null}
    {axes ? <>
      {zeroVisible ? <Line x1={g.left} x2={g.right} y1={g.zeroY} y2={g.zeroY} stroke={C.secondary} strokeOpacity={0.45} strokeWidth={0.8} strokeDasharray="4 4" /> : null}
      {ticks.map(({ value, y }) => <SvgText key={y} x={0} y={y + 3} fontFamily={InterFont.regular} fontSize={10} fill={C.secondary}>{axisPercent(value)}</SvgText>)}
    </> : null}
    {g.paths.map((path, i) => <Path key={`fill-${i}`} d={path.fill} fill={`url(#${id})`} />)}
    {g.paths.map((path, i) => <Path key={`line-${i}`} d={path.line} stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
    {g.segments.map((part, i) => { const end = part.at(-1)!; return <Circle key={i} cx={end.x} cy={end.y} r={2.7} fill={color} />; })}
  </Svg>;
});

export function TimeSeriesChart({ data, height = 80, color = C.chart, description, testID, axes = false, grid = true,
  interactive = true, minimumRange = 1, startLabel, endLabel, gapLabel, inspectionTestID, tooltipTestID }: {
  data: readonly ChartDatum[]; height?: number; color?: string; description: string; testID: string;
  axes?: boolean; grid?: boolean; interactive?: boolean; minimumRange?: number;
  startLabel?: string; endLabel?: string; gapLabel?: string; inspectionTestID?: string; tooltipTestID?: string;
}) {
  const [width, setWidth] = useState(300);
  const surface = useRef<View>(null);
  const [selection, setSelection] = useState<{ data: readonly ChartDatum[]; index: number } | null>(null);
  const id = `chart-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const geometry = useMemo(() => chartGeometry(data, width, height, { axes, includeZero: axes, minimumRange }), [data, width, height, axes, minimumRange]);
  const selected = selection?.data === data ? selection.index : null;
  const point = selected === null ? null : geometry.points[selected];
  const inspect = useCallback((x: number) => {
    if (!Number.isFinite(x)) return;
    const index = nearestPoint(geometry.points, x);
    if (index < 0) return;
    setSelection(previous => previous?.data === data && previous.index === index ? previous : { data, index });
  }, [data, geometry]);
  const inspectEvent = useCallback((event: GestureResponderEvent) => {
    const { locationX, pageX } = event.nativeEvent;
    // Web click events lack the locationX supplied by native responder events.
    if (Number.isFinite(locationX)) inspect(locationX);
    else if (Number.isFinite(pageX)) surface.current?.measureInWindow(x => inspect(pageX - x));
  }, [inspect]);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => interactive && Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: event => inspect(event.nativeEvent.locationX),
    onPanResponderMove: event => inspect(event.nativeEvent.locationX),
    onPanResponderTerminationRequest: () => true,
  }), [interactive, inspect]);
  return <View testID={testID} onLayout={event => { const next = event.nativeEvent.layout.width; if (next > 0) setWidth(previous => previous === next ? previous : next); }}>
    <Pressable ref={surface} {...(interactive ? pan.panHandlers : {})} onPress={interactive ? inspectEvent : undefined}
      testID={inspectionTestID ?? `${testID}-inspect`} style={{ height }} accessible accessibilityRole={interactive ? 'adjustable' : 'image'} accessibilityLabel={description}
      accessibilityHint={interactive ? 'Swipe horizontally to inspect values. Swipe vertically to scroll.' : undefined}
      accessibilityValue={interactive && geometry.points.length ? { min: 0, max: geometry.points.length - 1, now: selected ?? geometry.points.length - 1, text: (point ?? geometry.points.at(-1))?.label } : undefined}
      accessibilityActions={interactive ? [{ name: 'increment', label: 'Next valuation' }, { name: 'decrement', label: 'Previous valuation' }] : undefined}
      onAccessibilityAction={interactive ? event => setSelection({ data, index: Math.max(0, Math.min(geometry.points.length - 1, (selected ?? geometry.points.length - 1) + (event.nativeEvent.actionName === 'increment' ? 1 : -1))) }) : undefined}>
      <View pointerEvents="none"><Plot geometry={geometry} width={width} height={height} color={color} id={id} axes={axes} grid={grid} /></View>
      {point ? <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={width} height={height}><Line x1={point.x} x2={point.x} y1={geometry.top} y2={geometry.bottom} stroke={C.secondary} strokeDasharray="3 4" strokeOpacity={0.6} /><Circle cx={point.x} cy={point.y} r={4} fill={color} stroke={C.border} strokeWidth={2} /></Svg>
        <View testID={tooltipTestID ?? `${testID}-tooltip`} style={[s.tooltip, { left: Math.max(0, Math.min(width - 170, point.x - 85)) }]}><Text style={s.tooltipText}>{point.label}</Text></View>
      </View> : null}
    </Pressable>
    {startLabel || endLabel ? <View style={[s.dates, { paddingLeft: geometry.left }]}><Text style={s.date}>{startLabel}</Text><Text style={s.date}>{endLabel}</Text></View> : null}
    {gapLabel ? <Text style={s.gaps}>{gapLabel}</Text> : null}
  </View>;
}
const s = StyleSheet.create({
  dates: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 8, minHeight: 18 },
  date: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 16, color: C.secondary },
  gaps: { fontFamily: InterFont.regular, fontSize: 10, lineHeight: 15, color: C.secondary, textAlign: 'center' },
  tooltip: { position: 'absolute', top: 0, width: 170, borderRadius: 9, backgroundColor: C.ink, paddingHorizontal: 8, paddingVertical: 5, alignItems: 'center' },
  tooltipText: { fontFamily: InterFont.medium, fontSize: 10, lineHeight: 15, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
});
