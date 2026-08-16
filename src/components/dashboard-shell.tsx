"use client";

import { useEffect, useState } from "react";
import { AnalyticsView } from "@/components/analytics-view";
import { CommandCenter } from "@/components/command-center";
import { Icon, type IconName } from "@/components/icons";
import { Mt5Connection } from "@/components/mt5-connection";
import { RiskCalculator } from "@/components/risk-calculator";
import { SetupValidator } from "@/components/setup-validator";
import { TradeJournal } from "@/components/trade-journal";
import { useMt5Live } from "@/hooks/use-mt5-live";
import { defaultRules, seedTrades } from "@/lib/demo-data";
import { getSetupStatus } from "@/lib/strategy";
import type { InstrumentKey, TradeRecord } from "@/lib/types";

type ViewKey = "command" | "setup" | "risk" | "journal" | "analytics" | "mt5";

const navigation: Array<{ id: ViewKey; label: string; icon: IconName }> = [
  { id: "command", label: "Command centre", icon: "grid" },
  { id: "setup", label: "Setup validator", icon: "pulse" },
  { id: "risk", label: "Position calculator", icon: "calculator" },
  { id: "journal", label: "Trade journal", icon: "journal" },
  { id: "analytics", label: "Analytics", icon: "analytics" },
  { id: "mt5", label: "MT5 connection", icon: "plug" },
];

const STORAGE_KEY = "sentry-trades-v1";

export function DashboardShell() {
  const [activeView, setActiveView] = useState<ViewKey>("command");
  const [instrument, setInstrument] = useState<InstrumentKey>("USTEC");
  const [rules, setRules] = useState(defaultRules);
  const [trades, setTrades] = useState<TradeRecord[]>(seedTrades);
  const [storageReady, setStorageReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { loading: mt5Loading, state: mt5State } = useMt5Live();

  useEffect(() => {
    const hydrateStorage = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) setTrades(JSON.parse(stored) as TradeRecord[]);
      } catch {
        // Keep the safe demo dataset if local storage is unavailable or malformed.
      } finally {
        setStorageReady(true);
      }
    };
    const timer = window.setTimeout(hydrateStorage, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [storageReady, trades]);

  const navigate = (view: ViewKey) => {
    setActiveView(view);
    setMobileOpen(false);
  };

  const addTrade = (trade: TradeRecord) => setTrades((current) => [...current, trade]);
  const deleteTrade = (id: string) => setTrades((current) => current.filter((trade) => trade.id !== id));
  const setupStatus = getSetupStatus(rules);

  let content: React.ReactNode;
  switch (activeView) {
    case "setup":
      content = <SetupValidator instrument={instrument} onRulesChange={setRules} rules={rules} />;
      break;
    case "risk":
      content = <RiskCalculator />;
      break;
    case "journal":
      content = <TradeJournal onAddTrade={addTrade} onDeleteTrade={deleteTrade} trades={trades} />;
      break;
    case "analytics":
      content = <AnalyticsView trades={trades} />;
      break;
    case "mt5":
      content = <Mt5Connection state={mt5State} />;
      break;
    default:
      content = (
        <CommandCenter
          instrument={instrument}
          onInstrumentChange={setInstrument}
          onOpenSetup={() => navigate("setup")}
          setupStatus={setupStatus}
          trades={trades}
          live={mt5State}
        />
      );
  }

  const mt5Live = mt5State.connection === "live";
  const connectionLabel = mt5Loading
    ? "Checking MT5"
    : mt5State.connection === "live"
      ? "MT5 live"
      : mt5State.connection === "stale"
        ? "MT5 stale"
        : mt5State.connection === "unconfigured"
          ? "Storage unavailable"
          : mt5State.connection === "error"
            ? "MT5 error"
            : "MT5 offline";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand-mark"><i/><i/><i/></span>
          <div><strong>SENTRY</strong><small>Trading Command OS</small></div>
        </div>

        <nav aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navigation.slice(0, 5).map((item) => (
            <button className={activeView === item.id ? "is-active" : ""} key={item.id} onClick={() => navigate(item.id)} type="button">
              <Icon name={item.icon} /><span>{item.label}</span>{item.id === "setup" ? <i className={`nav-status nav-status--${setupStatus}`}/> : null}
            </button>
          ))}
          <span className="nav-label nav-label--system">System</span>
          {navigation.slice(5).map((item) => (
            <button className={activeView === item.id ? "is-active" : ""} key={item.id} onClick={() => navigate(item.id)} type="button">
              <Icon name={item.icon} /><span>{item.label}</span><i className={`nav-status nav-status--${mt5Live ? "valid" : "offline"}`}/>
            </button>
          ))}
        </nav>

        <div className="sidebar-guard">
          <span><Icon name="shield"/></span>
          <div><small>Risk guard</small><strong>All limits active</strong></div>
        </div>
        <div className="sidebar-account">
          <span>OA</span><div><strong>Oluwatosin</strong><small>{mt5State.account?.server ?? "MetaQuotes-Demo"}</small></div><i className={mt5Live ? "is-live" : ""}/>
        </div>
      </aside>

      {mobileOpen ? <button aria-label="Close navigation" className="sidebar-scrim" onClick={() => setMobileOpen(false)} type="button"/> : null}

      <div className="app-content">
        <header className="topbar">
          <button aria-label="Open navigation" className="mobile-menu" onClick={() => setMobileOpen(true)} type="button"><Icon name="menu"/></button>
          <div className="topbar-context"><span>LIVE WORKSPACE</span><b>/</b><strong>{navigation.find((item) => item.id === activeView)?.label}</strong></div>
          <div className="topbar-actions">
            <span className={`connection-pill ${mt5Live ? "connection-pill--live" : ""}`}><i/> {connectionLabel}</span>
            <button className="icon-button" onClick={() => navigate("mt5")} title="Open MT5 connection" type="button"><Icon name="plug"/></button>
          </div>
        </header>
        <main>{content}</main>
        <footer className="app-footer"><span>Sentry TradeOS · Strategy version 1.0</span><span>Decision support only · Execution remains manual</span></footer>
      </div>
    </div>
  );
}
