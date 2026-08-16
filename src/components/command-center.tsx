import { Icon } from "@/components/icons";
import { MetricCard } from "@/components/metric-card";
import { MiniChart } from "@/components/mini-chart";
import { SessionClock } from "@/components/session-clock";
import { instrumentData } from "@/lib/demo-data";
import { formatNumber, summarizeTrades } from "@/lib/strategy";
import type { InstrumentKey, Mt5LiveState, SetupStatus, TradeRecord } from "@/lib/types";

const ustecCurve = [44, 49, 46, 54, 51, 60, 63, 58, 66, 72, 69, 81, 78, 86, 93, 89, 99];
const eurGbpCurve = [88, 84, 86, 81, 78, 80, 74, 71, 73, 67, 64, 60, 63, 57, 54, 50, 47];

type CommandCenterProps = {
  instrument: InstrumentKey;
  onInstrumentChange: (instrument: InstrumentKey) => void;
  onOpenSetup: () => void;
  setupStatus: SetupStatus;
  trades: TradeRecord[];
  live: Mt5LiveState;
};

export function CommandCenter({
  instrument,
  onInstrumentChange,
  onOpenSetup,
  setupStatus,
  trades,
  live,
}: CommandCenterProps) {
  const market = instrumentData[instrument];
  const liveQuote = live.symbols.find((symbol) => symbol.name === instrument);
  const hasLiveQuote = live.connection === "live" && Boolean(liveQuote);
  const quotePrice = hasLiveQuote && liveQuote ? liveQuote.bid : market.price;
  const spread = hasLiveQuote && liveQuote
    ? instrument === "EURGBP"
      ? `${formatNumber((liveQuote.ask - liveQuote.bid) * 10_000, 1)} pip`
      : `${formatNumber(liveQuote.ask - liveQuote.bid, 1)} pts`
    : market.spread;
  const riskEquity = live.account?.equity ?? 10_000;
  const riskCurrency = live.account?.currency ?? "USD";
  const stats = summarizeTrades(trades);
  const weeklyTrades = Math.min(trades.length, 4);
  const statusLabel = setupStatus === "valid" ? "Valid trade" : setupStatus === "blocked" ? "No trade" : "Developing";

  return (
    <div className="view-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Strategy control</span>
          <h1>Trading command centre</h1>
          <p>One disciplined decision layer for USTEC and EURGBP.</p>
        </div>
        <SessionClock />
      </section>

      <section className="metrics-grid">
        <MetricCard icon="shield" label="Risk per trade" value="0.50%" detail={`${riskCurrency} ${formatNumber(riskEquity * 0.005, 2)} on ${formatNumber(riskEquity, 2)} equity`} tone="mint" />
        <MetricCard icon="journal" label="Weekly allowance" value={`${weeklyTrades} / 4`} detail={`${Math.max(0, 4 - weeklyTrades)} trade slots remaining`} tone="blue" />
        <MetricCard icon="analytics" label="Expectancy" value={`${formatNumber(stats.expectancy)}R`} detail={`${formatNumber(stats.winRate, 0)}% observed win rate`} tone="amber" />
        <MetricCard icon="warning" label="Max drawdown" value={`${formatNumber(stats.maxDrawdown)}R`} detail="4.00R monthly lock threshold" />
      </section>

      <section className="command-grid">
        <article className="panel market-panel">
          <div className="panel-header">
            <div className="instrument-tabs" aria-label="Select instrument">
              {(["USTEC", "EURGBP"] as InstrumentKey[]).map((key) => (
                <button
                  className={instrument === key ? "is-active" : ""}
                  key={key}
                  onClick={() => onInstrumentChange(key)}
                  type="button"
                >
                  {key === "USTEC" ? "US100" : "EUR/GBP"}
                  <small>{key}</small>
                </button>
              ))}
            </div>
            <span className={`data-badge ${hasLiveQuote ? "data-badge--live" : ""}`}><span /> {hasLiveQuote ? "Live MT5" : "Demo fallback"}</span>
          </div>

          <div className="quote-row">
            <div>
              <p>{hasLiveQuote ? `${instrument} · ${live.account?.server ?? "MetaTrader 5"}` : market.market}</p>
              <strong>{instrument === "EURGBP" ? quotePrice.toFixed(5) : formatNumber(quotePrice, 1)}</strong>
              {hasLiveQuote ? <span className="positive">Live bid</span> : (
                <span className={market.change >= 0 ? "positive" : "negative"}>
                  {market.change >= 0 ? "+" : ""}{market.change}% today
                </span>
              )}
            </div>
            <div className="quote-meta">
              <span><small>4H bias</small><b className={market.bias === "Bullish" ? "positive" : "negative"}>{market.bias}</b></span>
              <span><small>Spread</small><b>{spread}</b></span>
              <span><small>5M ATR</small><b>{market.atr}</b></span>
            </div>
          </div>

          <MiniChart values={instrument === "USTEC" ? ustecCurve : eurGbpCurve} positive={market.change >= 0} height={170} />

          <div className="chart-footer">
            <span>Session open</span><span>Liquidity test</span><span>Current price</span>
          </div>
        </article>

        <article className={`panel setup-signal signal-${setupStatus}`}>
          <div className="panel-header">
            <div>
              <span className="eyebrow">Setup engine</span>
              <h2>{statusLabel}</h2>
            </div>
            <span className="signal-orb"><span /></span>
          </div>

          <div className="signal-path">
            <div className="signal-step is-complete"><Icon name="check" /><span>4H structure</span><b>{market.bias}</b></div>
            <div className="signal-step is-complete"><Icon name="check" /><span>Liquidity sweep</span><b>Confirmed</b></div>
            <div className="signal-step is-complete"><Icon name="check" /><span>5M reclaim</span><b>Confirmed</b></div>
            <div className="signal-step is-waiting"><span className="step-number">4</span><span>1M structure break</span><b>Waiting</b></div>
          </div>

          <div className="signal-note">
            <Icon name="shield" />
            <p>No entry until every compulsory rule is confirmed. Missing the trade is preferable to breaking the plan.</p>
          </div>

          <button className="primary-button" onClick={onOpenSetup} type="button">
            Open setup validator <Icon name="arrow" />
          </button>
        </article>
      </section>

      <section className="lower-grid">
        <article className="panel session-panel">
          <div className="panel-header">
            <div><span className="eyebrow">Today’s windows</span><h2>Session plan</h2></div>
            <Icon name="clock" />
          </div>
          <div className="session-list">
            <div><span className="session-line session-line--london"/><div><strong>EUR/GBP</strong><small>08:00–11:00 London</small></div><b>London</b></div>
            <div><span className="session-line session-line--us"/><div><strong>US100</strong><small>13:30–17:30 Nigerian time</small></div><b>Lagos</b></div>
          </div>
          <p className="panel-footnote">EUR/GBP follows the London clock. The US100 plan runs from your fixed 1:30–5:30 p.m. Nigerian window.</p>
        </article>

        <article className="panel risk-panel">
          <div className="panel-header">
            <div><span className="eyebrow">Capital protection</span><h2>Risk guard</h2></div>
            <span className="status-pill status-pill--safe">Within limits</span>
          </div>
          <div className="risk-bars">
            <div><span><b>Daily risk</b><small>0.00% of 1.00%</small></span><i><em style={{ width: "2%" }}/></i></div>
            <div><span><b>Weekly risk</b><small>1.00% of 2.00%</small></span><i><em style={{ width: "50%" }}/></i></div>
            <div><span><b>Monthly drawdown</b><small>1.00% of 4.00%</small></span><i><em style={{ width: "25%" }}/></i></div>
          </div>
        </article>

        <article className="panel recent-panel">
          <div className="panel-header">
            <div><span className="eyebrow">Execution history</span><h2>Recent trades</h2></div>
            <span className="status-pill">{stats.total} total</span>
          </div>
          <div className="recent-trades">
            {trades.slice(-3).reverse().map((trade) => (
              <div key={trade.id}>
                <span className={`trade-mark trade-mark--${trade.instrument.toLowerCase()}`}>{trade.instrument === "USTEC" ? "U" : "E"}</span>
                <div><strong>{trade.instrument}</strong><small>{trade.setup}</small></div>
                <b className={trade.resultR >= 0 ? "positive" : "negative"}>{trade.resultR > 0 ? "+" : ""}{trade.resultR}R</b>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
