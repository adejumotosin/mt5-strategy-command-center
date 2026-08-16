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

export type Mt5SymbolQuote = {
  name: string;
  bid: number;
  ask: number;
  point: number;
  tickSize: number;
  tickValue: number;
  volumeMin: number;
  volumeMax: number;
  volumeStep: number;
};

export type Mt5Heartbeat = {
  accountId: string;
  server: string;
  currency: string;
  balance: number;
  equity: number;
  marginFree: number;
  serverTime: string;
  symbols: Mt5SymbolQuote[];
};

export type Mt5Snapshot = {
  sentAt: string;
  symbols: Mt5SymbolQuote[];
};

export type Mt5Deal = {
  ticket: string;
  order: string;
  positionId: string;
  symbol: string;
  type: number;
  entry: number;
  volume: number;
  price: number;
  profit: number;
  commission: number;
  swap: number;
  time: string;
  comment: string;
};

export type Mt5TradeEnvelope = {
  sentAt: string;
  deal: Mt5Deal;
};

export type Mt5LiveState = {
  storageConfigured: boolean;
  connection: "live" | "stale" | "offline" | "unconfigured" | "error";
  receivedAt: string | null;
  account: {
    maskedId: string;
    server: string;
    currency: string;
    balance: number;
    equity: number;
    marginFree: number;
    serverTime: string;
  } | null;
  symbols: Array<Mt5SymbolQuote & { quotedAt: string }>;
  recentDeals: Mt5Deal[];
};
