import { MetricCard } from "@/components/metric-card";
import { MiniChart } from "@/components/mini-chart";
import { formatNumber, summarizeTrades } from "@/lib/strategy";
import type { TradeRecord } from "@/lib/types";

export function AnalyticsView({ trades }: { trades: TradeRecord[] }) {
  const stats = summarizeTrades(trades);
  const ustec = summarizeTrades(trades.filter((trade) => trade.instrument === "USTEC"));
  const eurGbp = summarizeTrades(trades.filter((trade) => trade.instrument === "EURGBP"));

  return (
    <div className="view-stack">
      <section className="page-heading"><div><span className="eyebrow">Statistical evidence</span><h1>Performance analytics</h1><p>Judge the strategy by distributions and process, not memorable trades.</p></div><span className="status-pill">Results measured in R</span></section>
      <section className="metrics-grid">
        <MetricCard icon="analytics" label="Net performance" value={`${stats.totalR >= 0 ? "+" : ""}${formatNumber(stats.totalR)}R`} detail={`${stats.total} recorded trades`} tone="mint"/>
        <MetricCard icon="pulse" label="Profit factor" value={formatNumber(stats.profitFactor)} detail="Target threshold: 1.25" tone="blue"/>
        <MetricCard icon="shield" label="Plan adherence" value={`${formatNumber(stats.planAdherence, 0)}%`} detail="Process quality score" tone="amber"/>
        <MetricCard icon="warning" label="Max drawdown" value={`${formatNumber(stats.maxDrawdown)}R`} detail="Observed peak-to-trough decline"/>
      </section>
      <section className="analytics-grid">
        <article className="panel equity-panel">
          <div className="panel-header"><div><span className="eyebrow">Cumulative evidence</span><h2>R-equity curve</h2></div><span className="status-pill status-pill--safe">{formatNumber(stats.expectancy)}R expectancy</span></div>
          <div className="equity-value"><strong>{stats.totalR >= 0 ? "+" : ""}{formatNumber(stats.totalR)}R</strong><span>since journal start</span></div>
          <MiniChart values={stats.equityCurve.length > 1 ? stats.equityCurve : [0, 0]} positive={stats.totalR >= 0} height={240}/>
          <div className="chart-footer"><span>First trade</span><span>{trades.length} trades</span><span>Current</span></div>
        </article>
        <article className="panel instrument-comparison">
          <div className="panel-header"><div><span className="eyebrow">Market attribution</span><h2>Instrument comparison</h2></div></div>
          <div className="comparison-card comparison-card--ustec"><div><span>U</span><p><strong>US100</strong><small>USTEC</small></p></div><b>{ustec.totalR >= 0 ? "+" : ""}{formatNumber(ustec.totalR)}R</b><dl><div><dt>Win rate</dt><dd>{formatNumber(ustec.winRate, 0)}%</dd></div><div><dt>Expectancy</dt><dd>{formatNumber(ustec.expectancy)}R</dd></div></dl></div>
          <div className="comparison-card comparison-card--eurgbp"><div><span>E</span><p><strong>EUR/GBP</strong><small>EURGBP</small></p></div><b>{eurGbp.totalR >= 0 ? "+" : ""}{formatNumber(eurGbp.totalR)}R</b><dl><div><dt>Win rate</dt><dd>{formatNumber(eurGbp.winRate, 0)}%</dd></div><div><dt>Expectancy</dt><dd>{formatNumber(eurGbp.expectancy)}R</dd></div></dl></div>
        </article>
        <article className="panel benchmark-panel">
          <div className="panel-header"><div><span className="eyebrow">Activation gates</span><h2>Validation progress</h2></div></div>
          <div className="benchmark-list">
            <div><span><b>Profit factor</b><small>{formatNumber(stats.profitFactor)} / 1.25</small></span><i><em style={{ width: `${Math.min(100, (stats.profitFactor / 1.25) * 100)}%` }}/></i></div>
            <div><span><b>Historical sample</b><small>{stats.total} / 300 trades</small></span><i><em style={{ width: `${Math.min(100, (stats.total / 300) * 100)}%` }}/></i></div>
            <div><span><b>Forward test</b><small>0 / 30 trades</small></span><i><em style={{ width: "0%" }}/></i></div>
            <div><span><b>Plan adherence</b><small>{formatNumber(stats.planAdherence, 0)}% / 95%</small></span><i><em style={{ width: `${Math.min(100, stats.planAdherence / 0.95)}%` }}/></i></div>
          </div>
        </article>
      </section>
    </div>
  );
}
