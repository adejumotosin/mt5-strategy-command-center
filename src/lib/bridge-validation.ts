import type {
  Mt5Deal,
  Mt5Heartbeat,
  Mt5Snapshot,
  Mt5SymbolQuote,
  Mt5TradeEnvelope,
} from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseSymbol(value: unknown): Mt5SymbolQuote | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.name !== "string" ||
    !isFiniteNumber(value.bid) ||
    !isFiniteNumber(value.ask) ||
    !isFiniteNumber(value.point) ||
    !isFiniteNumber(value.tickSize) ||
    !isFiniteNumber(value.tickValue) ||
    !isFiniteNumber(value.volumeMin) ||
    !isFiniteNumber(value.volumeMax) ||
    !isFiniteNumber(value.volumeStep)
  ) return null;

  return {
    name: value.name,
    bid: value.bid,
    ask: value.ask,
    point: value.point,
    tickSize: value.tickSize,
    tickValue: value.tickValue,
    volumeMin: value.volumeMin,
    volumeMax: value.volumeMax,
    volumeStep: value.volumeStep,
  };
}

function parseSymbols(value: unknown[]): Mt5SymbolQuote[] | null {
  const symbols = value.map(parseSymbol);
  return symbols.every((symbol): symbol is Mt5SymbolQuote => symbol !== null) ? symbols : null;
}

export function parseHeartbeat(value: unknown): Mt5Heartbeat | null {
  if (!isRecord(value) || !Array.isArray(value.symbols)) return null;
  if (
    typeof value.accountId !== "string" ||
    typeof value.server !== "string" ||
    typeof value.currency !== "string" ||
    typeof value.serverTime !== "string" ||
    !isFiniteNumber(value.balance) ||
    !isFiniteNumber(value.equity) ||
    !isFiniteNumber(value.marginFree)
  ) return null;

  const symbols = parseSymbols(value.symbols);
  if (!symbols || symbols.length === 0) return null;
  return {
    accountId: value.accountId,
    server: value.server,
    currency: value.currency,
    balance: value.balance,
    equity: value.equity,
    marginFree: value.marginFree,
    serverTime: value.serverTime,
    symbols,
  };
}

export function parseSnapshot(value: unknown): Mt5Snapshot | null {
  if (!isRecord(value) || typeof value.sentAt !== "string" || !Array.isArray(value.symbols)) return null;
  const symbols = parseSymbols(value.symbols);
  if (!symbols || symbols.length === 0) return null;
  return { sentAt: value.sentAt, symbols };
}

function parseDeal(value: unknown): Mt5Deal | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.ticket !== "string" ||
    typeof value.order !== "string" ||
    typeof value.positionId !== "string" ||
    typeof value.symbol !== "string" ||
    typeof value.time !== "string" ||
    typeof value.comment !== "string" ||
    !isFiniteNumber(value.type) ||
    !isFiniteNumber(value.entry) ||
    !isFiniteNumber(value.volume) ||
    !isFiniteNumber(value.price) ||
    !isFiniteNumber(value.profit) ||
    !isFiniteNumber(value.commission) ||
    !isFiniteNumber(value.swap)
  ) return null;

  return {
    ticket: value.ticket,
    order: value.order,
    positionId: value.positionId,
    symbol: value.symbol,
    type: value.type,
    entry: value.entry,
    volume: value.volume,
    price: value.price,
    profit: value.profit,
    commission: value.commission,
    swap: value.swap,
    time: value.time,
    comment: value.comment,
  };
}

export function parseTradeEnvelope(value: unknown): Mt5TradeEnvelope | null {
  if (!isRecord(value) || typeof value.sentAt !== "string") return null;
  const deal = parseDeal(value.deal);
  return deal ? { sentAt: value.sentAt, deal } : null;
}
