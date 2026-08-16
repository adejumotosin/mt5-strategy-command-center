export type InstrumentKey = "USTEC" | "EURGBP";

export type SetupStatus = "valid" | "developing" | "blocked";

export type ValidationRule = {
  id: string;
  label: string;
  passed: boolean;
  required: boolean;
};

export type TradeRecord = {
  id: string;
  date: string;
  instrument: InstrumentKey;
  direction: "Long" | "Short";
  setup: string;
  resultR: number;
  followedPlan: boolean;
  note: string;
};

export type PositionInput = {
  instrument: InstrumentKey;
  direction: "Long" | "Short";
  equity: number;
  riskPercent: number;
  entry: number;
  stop: number;
  valuePerPoint: number;
  volumeMin: number;
  volumeMax: number;
  volumeStep: number;
};

export type PositionResult = {
  riskAmount: number;
  stopDistance: number;
  rawVolume: number;
  volume: number;
  actualRisk: number;
  target: number;
  valid: boolean;
  warning?: string;
};

export type Mt5Heartbeat = {
  accountId: string;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  marginFree: number;
  serverTime: string;
  symbols: Array<{
    name: string;
    bid: number;
    ask: number;
    point: number;
    tickSize: number;
    tickValue: number;
    volumeMin: number;
    volumeMax: number;
    volumeStep: number;
  }>;
};
