"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import { calculatePosition, formatNumber } from "@/lib/strategy";
import type { InstrumentKey, PositionInput } from "@/lib/types";

const defaults: Record<InstrumentKey, Pick<PositionInput, "entry" | "stop" | "valuePerPoint" | "volumeMin" | "volumeMax" | "volumeStep">> = {
  USTEC: { entry: 23864.2, stop: 23829.2, valuePerPoint: 1, volumeMin: 0.01, volumeMax: 100, volumeStep: 0.01 },
  EURGBP: { entry: 0.86642, stop: 0.86762, valuePerPoint: 100000, volumeMin: 0.01, volumeMax: 100, volumeStep: 0.01 },
};

export function RiskCalculator() {
  const [input, setInput] = useState<PositionInput>({
    instrument: "USTEC",
    direction: "Long",
    equity: 10000,
    riskPercent: 0.5,
    ...defaults.USTEC,
  });

  const result = useMemo(() => calculatePosition(input), [input]);

  const updateNumber = (key: keyof PositionInput, value: string) => {
    setInput((current) => ({ ...current, [key]: Number(value) }));
  };

  const selectInstrument = (instrument: InstrumentKey) => {
    setInput((current) => ({ ...current, instrument, ...defaults[instrument] }));
  };

  return (
    <div className="view-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Broker-aware sizing</span>
          <h1>Position calculator</h1>
          <p>Size every trade from the stop distance, never from conviction.</p>
        </div>
        <span className="status-pill status-pill--safe"><Icon name="shield" /> 0.50% ceiling active</span>
      </section>

      <section className="calculator-grid">
        <article className="panel calculator-form">
          <div className="panel-header">
            <div><span className="eyebrow">Trade parameters</span><h2>Calculate position</h2></div>
            <span className="data-badge"><span /> MT5 spec ready</span>
          </div>

          <div className="segmented-control" aria-label="Instrument">
            <button className={input.instrument === "USTEC" ? "is-active" : ""} onClick={() => selectInstrument("USTEC")} type="button">US100 <small>USTEC</small></button>
            <button className={input.instrument === "EURGBP" ? "is-active" : ""} onClick={() => selectInstrument("EURGBP")} type="button">EUR/GBP <small>EURGBP</small></button>
          </div>

          <div className="form-grid">
            <label>
              <span>Direction</span>
              <select value={input.direction} onChange={(event) => setInput((current) => ({ ...current, direction: event.target.value as "Long" | "Short" }))}>
                <option>Long</option><option>Short</option>
              </select>
            </label>
            <label>
              <span>Account equity</span>
              <div className="input-prefix"><b>$</b><input min="1" onChange={(event) => updateNumber("equity", event.target.value)} type="number" value={input.equity} /></div>
            </label>
            <label>
              <span>Entry price</span>
              <input onChange={(event) => updateNumber("entry", event.target.value)} step="any" type="number" value={input.entry} />
            </label>
            <label>
              <span>Stop price</span>
              <input onChange={(event) => updateNumber("stop", event.target.value)} step="any" type="number" value={input.stop} />
            </label>
            <label>
              <span>Risk percentage</span>
              <div className="input-suffix"><input max="0.5" min="0.01" onChange={(event) => updateNumber("riskPercent", event.target.value)} step="0.01" type="number" value={input.riskPercent} /><b>%</b></div>
            </label>
            <label>
              <span>Value per price unit, 1 lot</span>
              <input onChange={(event) => updateNumber("valuePerPoint", event.target.value)} step="any" type="number" value={input.valuePerPoint} />
              <small>Filled automatically by the MT5 bridge.</small>
            </label>
          </div>

          <div className="calculation-note">
            <Icon name="plug" />
            <p>When MT5 is connected, `OrderCalcProfit()` will replace the manual value with the broker’s exact loss for one lot in your account currency.</p>
          </div>
        </article>

        <aside className="panel calculation-result">
          <span className="eyebrow">Approved order profile</span>
          <div className={`result-verdict ${result.valid ? "is-valid" : "is-invalid"}`}>
            <span><Icon name={result.valid ? "check" : "warning"} /></span>
            <div><small>Calculation status</small><strong>{result.valid ? "WITHIN RISK LIMIT" : "ORDER BLOCKED"}</strong></div>
          </div>

          <div className="lot-result">
            <small>Recommended volume</small>
            <strong>{formatNumber(result.volume)} <span>lots</span></strong>
            <p>Rounded down to the broker’s {input.volumeStep} lot step.</p>
          </div>

          <dl className="result-list">
            <div><dt>Risk amount</dt><dd>${formatNumber(result.riskAmount)}</dd></div>
            <div><dt>Actual risk</dt><dd>${formatNumber(result.actualRisk)}</dd></div>
            <div><dt>Stop distance</dt><dd>{formatNumber(result.stopDistance, input.instrument === "EURGBP" ? 5 : 1)}</dd></div>
            <div><dt>4R target</dt><dd>{formatNumber(result.target, input.instrument === "EURGBP" ? 5 : 1)}</dd></div>
            <div><dt>Reward potential</dt><dd>${formatNumber(result.actualRisk * 4)}</dd></div>
          </dl>

          {result.warning ? <p className="result-warning"><Icon name="warning" />{result.warning}</p> : null}
          <button className="primary-button" disabled={!result.valid} type="button">Save trade plan <Icon name="arrow" /></button>
        </aside>
      </section>
    </div>
  );
}
