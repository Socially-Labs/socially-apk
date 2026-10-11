import type { CaptainPortfolio, VaultPerformancePage } from '../src/api/captain-portfolio.ts';
import type { CaptainRange } from '../src/api/captain-dashboard.ts';

export const vaultIds = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333'];
export function portfolioFixture(range: CaptainRange = '30D'): CaptainPortfolio {
  const now = Date.now(), start = now - (range === 'ALL' ? 90 : parseInt(range)) * 86400000;
  return { schemaVersion: 1, mode: 'PAPER', method: 'AGGREGATE_NAV_TWR_V1', range, revision: '123',
    serverTime: new Date(now).toISOString(), asOf: new Date(now - 12000).toISOString(), valuationAsOf: new Date(now - 12000).toISOString(),
    requestedFrom: new Date(start).toISOString(), baselineAt: new Date(start).toISOString(), intervalSeconds: range === '7D' ? 3600 : 86400,
    valuationStatus: 'CURRENT', coverage: 'COMPLETE', aumUsdc: '32600.000000', netPnlUsdc: '1240.000000', netFlowsUsdc: '0.000000', netReturnPercent: '3.800000',
    settledVaultPnlUsdc: '420.000000', openVaultPnlUsdc: '820.000000', activeVaults: 3, openVaults: 3, totalVaults: 3,
    points: [0, 0.35, 0.2, 0.8, 1.1, 0.9, 1.6, 1.4, 2.3, 2.9, 2.5, 2.1, 2.7, 3.2, 3.15, 3.8].map((value, index, all) => ({
      at: new Date(start + (now - 12000 - start) * index / (all.length - 1)).toISOString(), netPnlUsdc: (value / 3.8 * 1240).toFixed(6),
      netReturnPercent: value.toFixed(6), indexValue: (100 + value).toFixed(18), hasGap: false, segment: '0',
    })), methodology: 'Illustrative fixture; aggregate investment return excludes external cash flows.' };
}
export function vaultPerformanceFixture(range: CaptainRange = '30D'): VaultPerformancePage {
  const p = portfolioFixture(range);
  return { schemaVersion: 1, mode: 'PAPER', range, revision: p.revision, serverTime: p.serverTime, asOf: p.asOf, nextCursor: null,
    vaults: ['Black Pearl', 'North Star', 'Sea Wolf'].map((name, index) => ({ vaultId: vaultIds[index], name, phase: 'ACTIVE',
      aumUsdc: ['18400.000000', '9200.000000', '5000.000000'][index], netPnlUsdc: ['860.000000', '510.000000', '-130.000000'][index],
      lifetimePnlUsdc: ['860.000000', '510.000000', '-130.000000'][index], netReturnPercent: ['4.000000', '5.000000', '-2.000000'][index],
      baselineAt: p.baselineAt, valuationStatus: 'CURRENT', valuationAsOf: p.valuationAsOf })) };
}
