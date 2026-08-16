"use client";

import { Icon } from "@/components/icons";
import { getSetupStatus } from "@/lib/strategy";
import type { InstrumentKey, ValidationRule } from "@/lib/types";

type SetupValidatorProps = {
  instrument: InstrumentKey;
  rules: ValidationRule[];
  onRulesChange: (rules: ValidationRule[]) => void;
};

export function SetupValidator({ instrument, rules, onRulesChange }: SetupValidatorProps) {
  const status = getSetupStatus(rules);
  const passed = rules.filter((rule) => rule.passed).length;

  const toggleRule = (id: string) => {
    onRulesChange(rules.map((rule) => rule.id === id ? { ...rule, passed: !rule.passed } : rule));
  };

  return (
    <div className="view-stack">
      <section className="page-heading">
        <div>
          <span className="eyebrow">Mechanical execution</span>
          <h1>Setup validator</h1>
          <p>Every compulsory rule must pass before {instrument} is permitted.</p>
        </div>
        <div className={`validator-status validator-status--${status}`}>
          <span className="signal-orb"><span /></span>
          <div><small>Current decision</small><strong>{status === "valid" ? "VALID TRADE" : status === "blocked" ? "NO TRADE" : "DEVELOPING"}</strong></div>
        </div>
      </section>

      <section className="validator-grid">
        <article className="panel validator-rules">
          <div className="panel-header">
            <div><span className="eyebrow">Rule sequence</span><h2>{passed} of {rules.length} confirmed</h2></div>
            <span className="completion-ring" style={{ "--completion": `${(passed / rules.length) * 360}deg` } as React.CSSProperties}><b>{Math.round((passed / rules.length) * 100)}%</b></span>
          </div>
          <div className="rule-list">
            {rules.map((rule, index) => (
              <button className={rule.passed ? "is-passed" : ""} key={rule.id} onClick={() => toggleRule(rule.id)} type="button">
                <span className="rule-check">{rule.passed ? <Icon name="check" /> : index + 1}</span>
                <span><strong>{rule.label}</strong><small>{rule.required ? "Compulsory rule" : "Context only"}</small></span>
                <b>{rule.passed ? "Passed" : "Waiting"}</b>
              </button>
            ))}
          </div>
        </article>

        <aside className="validator-side">
          <article className="panel decision-card">
            <span className="eyebrow">Decision protocol</span>
            <h2>{status === "valid" ? "Risk may be calculated" : "Entry is locked"}</h2>
            <p>{status === "valid" ? "All mandatory evidence is present. Confirm the broker-aware lot size before entry." : "The dashboard will not permit the trade while any compulsory condition remains incomplete."}</p>
            <div className="decision-line"><Icon name={status === "valid" ? "check" : "shield"}/><span>{status === "valid" ? "Proceed to position sizing" : "Capital remains protected"}</span></div>
          </article>

          <article className="panel strategy-card">
            <span className="eyebrow">Active model</span>
            <h2>Liquidity sweep + reclaim</h2>
            <dl>
              <div><dt>Instrument</dt><dd>{instrument}</dd></div>
              <div><dt>Confirmation</dt><dd>5M + 1M</dd></div>
              <div><dt>Risk</dt><dd>0.50%</dd></div>
              <div><dt>Target</dt><dd>4.00R</dd></div>
            </dl>
          </article>

          <article className="panel discipline-card">
            <Icon name="warning" />
            <div><strong>One setup, one decision</strong><p>A missed entry is not permission to chase or reuse a swept level.</p></div>
          </article>
        </aside>
      </section>
    </div>
  );
}
