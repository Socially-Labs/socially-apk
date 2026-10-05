/** UI fixtures only. These vaults are not deployed and confer no trading authority. */
export const captainPeriods = ['7D', '30D', '90D', 'ALL'] as const;
export type CaptainPeriod = (typeof captainPeriods)[number];
export type CaptainVaultStatus = 'Active' | 'Deposits paused' | 'Draft';
export type CaptainVault = {
  id: string; name: string; strategy: 'Balanced' | 'Momentum' | 'Long term';
  status: CaptainVaultStatus; aumCents: number; crew: number; exits: number;
  earnedCents: number; returns: Record<CaptainPeriod, number>;
  holdings: { symbol: 'SOL' | 'BTC' | 'USDC'; weight: number }[];
};

export const sampleCaptainVaults: readonly CaptainVault[] = [
  { id: 'horizon', name: 'Horizon Growth', strategy: 'Balanced', status: 'Active', aumCents: 48200000, crew: 124, exits: 0,
    earnedCents: 98400, returns: { '7D': 1.2, '30D': 8.4, '90D': 22.6, ALL: 36.2 },
    holdings: [{ symbol: 'SOL', weight: 45 }, { symbol: 'BTC', weight: 30 }, { symbol: 'USDC', weight: 25 }] },
  { id: 'solana-current', name: 'Solana Current', strategy: 'Momentum', status: 'Active', aumCents: 12400000, crew: 86, exits: 0,
    earnedCents: 19200, returns: { '7D': -2.1, '30D': 12.6, '90D': 31.4, ALL: 42.8 },
    holdings: [{ symbol: 'SOL', weight: 75 }, { symbol: 'USDC', weight: 25 }] },
  { id: 'long-view', name: 'The Long View', strategy: 'Long term', status: 'Deposits paused', aumCents: 4200000, crew: 22, exits: 2,
    earnedCents: 7200, returns: { '7D': -0.8, '30D': 4.2, '90D': 9.8, ALL: 18.4 },
    holdings: [{ symbol: 'BTC', weight: 65 }, { symbol: 'SOL', weight: 10 }, { symbol: 'USDC', weight: 25 }] },
];

export function captainTotals(vaults: readonly CaptainVault[]) {
  return vaults.reduce((total, vault) => ({
    aumCents: total.aumCents + vault.aumCents, crew: total.crew + vault.crew,
    exits: total.exits + vault.exits, earnedCents: total.earnedCents + vault.earnedCents,
    active: total.active + (vault.status === 'Active' ? 1 : 0),
  }), { aumCents: 0, crew: 0, exits: 0, earnedCents: 0, active: 0 });
}

const aumChangeCents: Record<CaptainPeriod, number> = { '7D': -420000, '30D': 2480000, '90D': 8634000, ALL: 14800000 };
const shape = [0, 0.1, 0.06, 0.19, 0.14, 0.29, 0.25, 0.43, 0.37, 0.55, 0.5, 0.65, 0.6, 0.78, 0.73, 0.92, 0.87, 1];
export function captainAumPerformance(period: CaptainPeriod, totalCents: number) {
  const changeCents = totalCents === 0 ? 0 : aumChangeCents[period];
  const startCents = totalCents - changeCents;
  return { changeCents, percent: startCents === 0 ? 0 : changeCents / startCents * 100, values: shape.map(point => startCents + point * changeCents) };
}
export function captainMoney(cents: number) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
export function captainPercent(value: number) { return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(2)}%`; }
export function captainChange(cents: number) { return `${cents >= 0 ? '+' : '−'}${captainMoney(Math.abs(cents))}`; }

export const captainCrewMembers = [
  { name: 'Aarav', initials: 'AA', vault: 'horizon', joined: 'Joined 2 days ago', amountCents: 250000 },
  { name: 'Maya', initials: 'MY', vault: 'solana-current', joined: 'Joined 3 days ago', amountCents: 120000 },
  { name: 'Noah', initials: 'NH', vault: 'horizon', joined: 'Joined 5 days ago', amountCents: 500000 },
  { name: 'Isha', initials: 'IS', vault: 'long-view', joined: 'Joined 1 week ago', amountCents: 80000 },
];
