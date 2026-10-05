import { crewInvestedCents, crewMoney, crewPercent, crewPerformance, crewPositions, crewSignedMoney, crewTotalCents, type CrewPeriod } from '@/constants/crew-portfolio';
import { HomePerformanceCard } from './home-performance-card';

export function CrewPortfolioCard({ hidden, canToggle, onToggle, onOverview, period, onPeriod, compact, error }: {
  hidden: boolean; canToggle: boolean; onToggle: () => void; onOverview: () => void;
  period: CrewPeriod; onPeriod: (period: CrewPeriod) => void; compact: boolean; error: string | null;
}) {
  const performance = crewPerformance(period);
  return <HomePerformanceCard variant="frosted-pills" label="Portfolio value" balance={crewMoney(crewTotalCents)}
    change={`${crewSignedMoney(performance.gainCents)} (${crewPercent(performance.percent)})`} positive={performance.gainCents >= 0}
    changeCaption={period === 'ALL' ? 'since invested' : `past ${period === '7D' ? '7' : period === '30D' ? '30' : '90'} days`}
    values={performance.values} chartDescription={`Sample portfolio value, from ${crewMoney(performance.values[0])} to ${crewMoney(crewTotalCents)}`}
    metrics={[{ label: 'You invested', value: hidden ? '••••' : crewMoney(crewInvestedCents), testID: 'home-invested' }, { label: 'Captain vaults', value: String(crewPositions.length) }]}
    hidden={hidden} canToggle={canToggle} onToggle={onToggle} onOverview={onOverview} overviewLabel="View your portfolio breakdown"
    period={period} onPeriod={onPeriod} compact={compact} error={error} testIDPrefix="home" summaryTestID="portfolio-summary"
    balanceTestID="home-portfolio-value" changeTestID="home-portfolio-return" overviewTestID="portfolio-overview" />;
}
