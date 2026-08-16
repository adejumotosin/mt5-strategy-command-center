import type { Mt5Heartbeat } from "@/lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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

  const symbols = value.symbols.flatMap((symbol) => {
    if (!isRecord(symbol)) return [];
    if (
      typeof symbol.name !== "string" ||
      !isFiniteNumber(symbol.bid) ||
      !isFiniteNumber(symbol.ask) ||
      !isFiniteNumber(symbol.point) ||
      !isFiniteNumber(symbol.tickSize) ||
      !isFiniteNumber(symbol.tickValue) ||
      !isFiniteNumber(symbol.volumeMin) ||
      !isFiniteNumber(symbol.volumeMax) ||
      !isFiniteNumber(symbol.volumeStep)
    ) return [];
    return [{
      name: symbol.name,
      bid: symbol.bid,
      ask: symbol.ask,
      point: symbol.point,
      tickSize: symbol.tickSize,
      tickValue: symbol.tickValue,
      volumeMin: symbol.volumeMin,
      volumeMax: symbol.volumeMax,
      volumeStep: symbol.volumeStep,
    }];
  });

  if (symbols.length === 0) return null;
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

export function isBridgeEnvelope(value: unknown) {
  if (!isRecord(value)) return false;
  return typeof value.sentAt === "string" && Array.isArray(value.symbols);
}

export function isTradeEnvelope(value: unknown) {
  if (!isRecord(value)) return false;
  return typeof value.sentAt === "string" && isRecord(value.deal);
}
