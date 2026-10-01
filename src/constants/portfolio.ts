export type MarketSymbol = 'SOL' | 'BTC' | 'ETH';
export type StakedMarket = {
  symbol: MarketSymbol;
  name: string;
  amount: string;
  allocation: number;
  change: string;
  positive: boolean;
  chart: string;
};

// Reference data for the app preview; no network request or wallet is required.
export const stakedMarkets: readonly StakedMarket[] = [
  { symbol: 'SOL', name: 'Solana', amount: '$4,230.50', allocation: 40, change: '+5.21%', positive: true,
    chart: 'M2 42 C5 32 7 27 11 31 S18 38 23 29 S29 17 35 22 S42 27 46 20 S54 26 59 18 S64 25 70 8 S76 8 80 15' },
  { symbol: 'BTC', name: 'Bitcoin', amount: '$3,980.10', allocation: 37, change: '-1.12%', positive: false,
    chart: 'M2 6 C6 14 7 26 13 23 S18 29 23 20 S29 10 34 18 S40 15 46 20 S50 33 57 31 S65 28 70 39 S75 43 80 30' },
  { symbol: 'ETH', name: 'Ethereum', amount: '$2,291.60', allocation: 23, change: '+2.48%', positive: true,
    chart: 'M2 43 C7 26 10 33 14 36 S24 31 28 20 S34 16 38 22 S46 21 49 25 S55 20 60 17 S65 22 69 9 S76 13 80 16' },
];

export const portfolio = { totalStaked: '$10,502.20', pnl: '+$320.18', crewMembers: 12 } as const;
