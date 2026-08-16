"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import type { InstrumentKey, TradeRecord } from "@/lib/types";

type TradeJournalProps = {
  trades: TradeRecord[];
  onAddTrade: (trade: TradeRecord) => void;
  onDeleteTrade: (id: string) => void;
};

export function TradeJournal({ trades, onAddTrade, onDeleteTrade }: TradeJournalProps) {
  const [showForm, setShowForm] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentKey>("USTEC");
  const [direction, setDirection] = useState<"Long" | "Short">("Long");
  const [setup, setSetup] = useState("Overnight low sweep");
  const [resultR, setResultR] = useState("4");
  const [note, setNote] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onAddTrade({
      id: crypto.randomUUID(),
      date: new Date().toISOString().slice(0, 10),
      instrument,
      direction,
      setup,
      resultR: Number(resultR),
      followedPlan: true,
      note: note.trim() || "Journal entry added manually.",
    });
    setNote("");
    setShowForm(false);
  };

  return (
    <div className="view-stack">
      <section className="page-heading">
        <div><span className="eyebrow">Execution evidence</span><h1>Trade journal</h1><p>Separate strategy quality from the outcome of any single trade.</p></div>
        <button className="primary-button primary-button--compact" onClick={() => setShowForm((value) => !value)} type="button"><Icon name={showForm ? "close" : "plus"} /> {showForm ? "Close" : "Add trade"}</button>
      </section>

      {showForm ? (
        <form className="panel journal-form" onSubmit={submit}>
          <div className="panel-header"><div><span className="eyebrow">Manual record</span><h2>Add completed trade</h2></div><span className="status-pill">MT5 imports will appear automatically</span></div>
          <div className="form-grid form-grid--journal">
            <label><span>Instrument</span><select onChange={(event) => setInstrument(event.target.value as InstrumentKey)} value={instrument}><option value="USTEC">US100 · USTEC</option><option value="EURGBP">EUR/GBP</option></select></label>
            <label><span>Direction</span><select onChange={(event) => setDirection(event.target.value as "Long" | "Short")} value={direction}><option>Long</option><option>Short</option></select></label>
            <label><span>Setup</span><input onChange={(event) => setSetup(event.target.value)} required value={setup}/></label>
            <label><span>Result in R</span><input onChange={(event) => setResultR(event.target.value)} required step="0.1" type="number" value={resultR}/></label>
            <label className="form-span"><span>Trade note</span><textarea onChange={(event) => setNote(event.target.value)} placeholder="What happened, and did you follow the plan?" value={note}/></label>
          </div>
          <div className="form-actions"><button className="secondary-button" onClick={() => setShowForm(false)} type="button">Cancel</button><button className="primary-button primary-button--compact" type="submit">Save journal entry</button></div>
        </form>
      ) : null}

      <section className="panel journal-table-panel">
        <div className="panel-header"><div><span className="eyebrow">Complete history</span><h2>{trades.length} recorded trades</h2></div><div className="table-legend"><span><i className="legend-dot legend-dot--green"/>Plan followed</span><span><i className="legend-dot legend-dot--amber"/>Review needed</span></div></div>
        <div className="journal-table-wrap">
          <table className="journal-table">
            <thead><tr><th>Date</th><th>Instrument</th><th>Direction</th><th>Setup</th><th>Result</th><th>Process</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {trades.slice().reverse().map((trade) => (
                <tr key={trade.id}>
                  <td>{trade.date}</td>
                  <td><span className={`symbol-chip symbol-chip--${trade.instrument.toLowerCase()}`}>{trade.instrument}</span></td>
                  <td>{trade.direction}</td>
                  <td><strong>{trade.setup}</strong><small>{trade.note}</small></td>
                  <td><b className={trade.resultR >= 0 ? "positive" : "negative"}>{trade.resultR > 0 ? "+" : ""}{trade.resultR}R</b></td>
                  <td><span className={trade.followedPlan ? "process-pass" : "process-review"}><Icon name={trade.followedPlan ? "check" : "warning"}/>{trade.followedPlan ? "Followed" : "Review"}</span></td>
                  <td><button aria-label={`Delete ${trade.instrument} trade from ${trade.date}`} className="icon-button" onClick={() => onDeleteTrade(trade.id)} type="button"><Icon name="trash"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
