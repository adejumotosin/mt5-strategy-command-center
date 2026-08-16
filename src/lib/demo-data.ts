import type { InstrumentKey, TradeRecord, ValidationRule } from "@/lib/types";

export const instrumentData: Record<
  InstrumentKey,
  {
    label: string;
    market: string;
    price: number;
    change: number;
    spread: string;
    atr: string;
    session: string;
    bias: "Bullish" | "Bearish";
  }
> = {
  USTEC: {
    label: "US100",
    market: "USTEC · MetaQuotes-Demo",
    price: 23864.2,
    change: 0.62,
    spread: "2.4 pts",
    atr: "36.8 pts",
    session: "US entry window",
    bias: "Bullish",
  },
  EURGBP: {
    label: "EUR/GBP",
    market: "EURGBP · MetaQuotes-Demo",
    price: 0.86642,
    change: -0.14,
    spread: "0.8 pip",
    atr: "4.6 pips",
    session: "London entry window",
    bias: "Bearish",
  },
};

export const defaultRules: ValidationRule[] = [
  { id: "session", label: "Inside approved session", passed: true, required: true },
  { id: "structure", label: "4H structure confirmed", passed: true, required: true },
  { id: "level", label: "Level marked before session", passed: true, required: true },
  { id: "first-sweep", label: "First sweep of the level", passed: true, required: true },
  { id: "reclaim", label: "5M reclaim within three candles", passed: true, required: true },
  { id: "mss", label: "1M closing structure break", passed: false, required: true },
  { id: "room", label: "At least 4R available", passed: true, required: true },
  { id: "spread", label: "Spread within 10% of stop", passed: true, required: true },
  { id: "block-news", label: "No restricted news event", passed: true, required: true },
  { id: "block-risk", label: "Risk limits available", passed: true, required: true },
];

export const seedTrades: TradeRecord[] = [
  {
    id: "seed-1",
    date: "2026-08-04",
    instrument: "EURGBP",
    direction: "Short",
    setup: "Asian high sweep",
    resultR: 4,
    followedPlan: true,
    note: "Clean reclaim and displacement.",
  },
  {
    id: "seed-2",
    date: "2026-08-06",
    instrument: "USTEC",
    direction: "Long",
    setup: "Overnight low sweep",
    resultR: -1,
    followedPlan: true,
    note: "Valid loss. No re-entry.",
  },
  {
    id: "seed-3",
    date: "2026-08-11",
    instrument: "EURGBP",
    direction: "Short",
    setup: "Previous-day high sweep",
    resultR: -1,
    followedPlan: true,
    note: "Structure failed after entry.",
  },
  {
    id: "seed-4",
    date: "2026-08-13",
    instrument: "USTEC",
    direction: "Long",
    setup: "Cash-session low sweep",
    resultR: 4,
    followedPlan: true,
    note: "Target reached before noon ET.",
  },
];
