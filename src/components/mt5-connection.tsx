"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import type { Mt5LiveState } from "@/lib/types";

type Mt5ConnectionProps = { state: Mt5LiveState };

export function Mt5Connection({ state }: Mt5ConnectionProps) {
  const [baseUrl, setBaseUrl] = useState("https://your-dashboard.vercel.app");
  const connected = state.connection === "live";
  const statusLabel = connected ? "Connected" : state.connection === "stale" ? "Stale" : "Awaiting EA";
  const terminalStatus = connected ? "CONNECTED · READ ONLY" : state.connection === "stale" ? "CONNECTION STALE" : "NOT CONNECTED";
  const terminalMessage = connected
    ? `Receiving ${state.symbols.map((symbol) => symbol.name).join(" and ")} telemetry through the secure bridge.`
    : state.connection === "stale"
      ? "The last heartbeat is older than 30 seconds. Confirm MT5 and Algo Trading are running."
      : "Install or enable the read-only Expert Advisor to begin secure synchronisation.";

  useEffect(() => {
    const timer = window.setTimeout(() => setBaseUrl(window.location.origin), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="view-stack">
      <section className="page-heading"><div><span className="eyebrow">Terminal bridge</span><h1>MetaTrader 5 connection</h1><p>Connect MetaQuotes-Demo without sharing your login or trading password.</p></div><span className={`status-pill ${connected ? "status-pill--safe" : "status-pill--warning"}`}><span className="market-dot"/>{statusLabel}</span></section>
      <section className="connection-grid">
        <article className="panel terminal-card">
          <div className="terminal-screen">
            <div className="terminal-top"><span/><span/><span/><b>StrategyBridgeEA</b></div>
            <div className="terminal-body">
              <span className="terminal-logo">5</span>
              <div><small>TERMINAL STATUS</small><strong className={connected ? "positive" : ""}>{terminalStatus}</strong><p>{terminalMessage}</p></div>
            </div>
            <div className="terminal-footer"><span>Server: {state.account?.server ?? "MetaQuotes-Demo"}</span><span>{state.account?.maskedId ? `Account: ${state.account.maskedId}` : "Mode: Read only"}</span></div>
          </div>
          <a className="primary-button download-button" download href="/StrategyBridgeEA.mq5"><Icon name="download"/> Download MQL5 source</a>
          <p className="download-note">Compile this source in MetaEditor to create `StrategyBridgeEA.ex5`.</p>
        </article>
        <article className="panel setup-steps">
          <div className="panel-header"><div><span className="eyebrow">One-time setup</span><h2>Connect your terminal</h2></div><span className="status-pill">5 steps</span></div>
          <ol>
            <li><span>1</span><div><strong>Download and compile the EA</strong><p>Open the source in MetaEditor, press F7 and confirm zero errors.</p></div></li>
            <li><span>2</span><div><strong>Allow the dashboard URL</strong><p>In MT5, open Tools → Options → Expert Advisors and add:</p><code>{baseUrl}</code></div></li>
            <li><span>3</span><div><strong>Attach it to one chart</strong><p>The timer-based bridge monitors both mapped instruments from a single chart.</p></div></li>
            <li><span>4</span><div><strong>Enter the bridge token</strong><p>Use the same private token configured in Vercel as `MT5_BRIDGE_TOKEN`.</p></div></li>
            <li><span>5</span><div><strong>Confirm the mappings</strong><p>US100 → USTEC and EUR/GBP → EURGBP.</p></div></li>
          </ol>
        </article>
        <article className="panel mapping-card">
          <div className="panel-header"><div><span className="eyebrow">Broker contract map</span><h2>MetaQuotes-Demo</h2></div><Icon name="plug"/></div>
          <div className="mapping-row"><span className="trade-mark trade-mark--ustec">U</span><div><small>Dashboard</small><strong>US100</strong></div><Icon name="arrow"/><div><small>MT5 symbol</small><strong>USTEC</strong></div><span className="process-pass"><Icon name="check"/>{state.symbols.some((symbol) => symbol.name === "USTEC") ? "Live" : "Found"}</span></div>
          <div className="mapping-row"><span className="trade-mark trade-mark--eurgbp">E</span><div><small>Dashboard</small><strong>EUR/GBP</strong></div><Icon name="arrow"/><div><small>MT5 symbol</small><strong>EURGBP</strong></div><span className="process-pass"><Icon name="check"/>{state.symbols.some((symbol) => symbol.name === "EURGBP") ? "Live" : "Found"}</span></div>
        </article>
        <article className="panel security-card">
          <Icon name="shield"/><div><span className="eyebrow">Security boundary</span><h2>Your credentials stay in MT5</h2><p>The bridge sends market and trade records only. It does not transmit your password and contains no trade-execution function.</p></div>
        </article>
      </section>
    </div>
  );
}
