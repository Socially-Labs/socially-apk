import { discoverCaptains } from './discover';

/** Personal positions for the Home UI preview, independent of Captain strategy returns. */
export const crewPositions = [
  { captainId: 'atlas', investedCents: 400000, valueCents: 423050 },
  { captainId: 'solstice', investedCents: 380000, valueCents: 398010 },
  { captainId: 'northstar', investedCents: 220000, valueCents: 229160 },
].map(position => {
  const captain = discoverCaptains.find(item => item.id === position.captainId);
  if (!captain) throw new Error(`Missing preview Captain: ${position.captainId}`);
  return { ...position, captain, gainCents: position.valueCents - position.investedCents };
});

export type CrewPosition = (typeof crewPositions)[number];
export const crewTotalCents = crewPositions.reduce((total, position) => total + position.valueCents, 0);
export const crewInvestedCents = crewPositions.reduce((total, position) => total + position.investedCents, 0);
export const crewGainCents = crewTotalCents - crewInvestedCents;
export const crewPeriods = ['7D', '30D', '90D', 'ALL'] as const;
export type CrewPeriod = (typeof crewPeriods)[number];
const periodGain: Record<CrewPeriod, number> = { '7D': -4820, '30D': 32018, '90D': 45160, ALL: crewGainCents };
const shapes: Record<CrewPeriod, number[]> = {
  '7D': [0, 0.1, -0.2, 0.3, 0.1, 0.6, 0.4, 0.7, 1],
  '30D': [0, 0.08, 0.04, 0.19, 0.13, 0.32, 0.28, 0.43, 0.31, 0.56, 0.49, 0.63, 0.55, 0.78, 0.68, 0.85, 0.82, 1],
  '90D': [0, 0.15, 0.05, 0.28, 0.18, 0.4, 0.3, 0.48, 0.43, 0.66, 0.55, 0.74, 0.68, 0.89, 0.8, 1],
  ALL: [0, 0.12, 0.05, 0.25, 0.2, 0.36, 0.29, 0.46, 0.42, 0.64, 0.56, 0.74, 0.7, 0.85, 0.8, 1],
};

export function crewPerformance(period: CrewPeriod) {
  const gainCents = periodGain[period];
  const startCents = crewTotalCents - gainCents;
  const end = Date.parse('2026-10-11T12:00:00.000Z'); // Fixed preview history, never presented as live valuations.
  const days = period === '7D' ? 7 : period === '30D' ? 30 : period === '90D' ? 90 : 120;
  return {
    timestamps: shapes[period].map((_, index, points) => new Date(end - (1 - index / (points.length - 1)) * days * 86400000).toISOString()),
    gainCents, percent: gainCents / startCents * 100,
    values: shapes[period].map(point => startCents + point * gainCents),
  };
}

export function crewMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export function crewSignedMoney(cents: number) { return `${cents >= 0 ? '+' : '−'}${crewMoney(Math.abs(cents))}`; }
export function crewPercent(value: number) { return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}%`; }
