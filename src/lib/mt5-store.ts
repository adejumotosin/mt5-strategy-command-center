import { isDatabaseConfigured, neonQuery } from "@/lib/neon-http";
import type {
  Mt5Deal,
  Mt5Heartbeat,
  Mt5LiveState,
  Mt5Snapshot,
  Mt5SymbolQuote,
  Mt5TradeEnvelope,
} from "@/lib/types";

let schemaReady: Promise<void> | null = null;

function numberValue(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function maskAccountId(accountId: string) {
  return accountId.length <= 4 ? accountId : `••••${accountId.slice(-4)}`;
}

async function createSchema() {
  await Promise.all([
    neonQuery(`
      CREATE TABLE IF NOT EXISTS sentry_mt5_account_state (
        singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
        account_id text NOT NULL,
        server text NOT NULL,
        currency text NOT NULL,
        balance double precision NOT NULL,
        equity double precision NOT NULL,
        margin_free double precision NOT NULL,
        server_time timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now()
      )
    `),
    neonQuery(`
      CREATE TABLE IF NOT EXISTS sentry_mt5_symbol_state (
        symbol text PRIMARY KEY,
        bid double precision NOT NULL,
        ask double precision NOT NULL,
        point double precision NOT NULL,
        tick_size double precision NOT NULL,
        tick_value double precision NOT NULL,
        volume_min double precision NOT NULL,
        volume_max double precision NOT NULL,
        volume_step double precision NOT NULL,
        quoted_at timestamptz NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now()
      )
    `),
    neonQuery(`
      CREATE TABLE IF NOT EXISTS sentry_mt5_deals (
        ticket text PRIMARY KEY,
        order_id text NOT NULL,
        position_id text NOT NULL,
        symbol text NOT NULL,
        deal_type integer NOT NULL,
        entry_type integer NOT NULL,
        volume double precision NOT NULL,
        price double precision NOT NULL,
        profit double precision NOT NULL,
        commission double precision NOT NULL,
        swap double precision NOT NULL,
        dealt_at timestamptz NOT NULL,
        comment text NOT NULL,
        received_at timestamptz NOT NULL DEFAULT now()
      )
    `),
  ]);
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = createSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function saveSymbol(symbol: Mt5SymbolQuote, quotedAt: string) {
  await neonQuery(`
    INSERT INTO sentry_mt5_symbol_state (
      symbol, bid, ask, point, tick_size, tick_value,
      volume_min, volume_max, volume_step, quoted_at, received_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::timestamptz, now())
    ON CONFLICT (symbol) DO UPDATE SET
      bid = EXCLUDED.bid,
      ask = EXCLUDED.ask,
      point = EXCLUDED.point,
      tick_size = EXCLUDED.tick_size,
      tick_value = EXCLUDED.tick_value,
      volume_min = EXCLUDED.volume_min,
      volume_max = EXCLUDED.volume_max,
      volume_step = EXCLUDED.volume_step,
      quoted_at = EXCLUDED.quoted_at,
      received_at = now()
  `, [
    symbol.name,
    symbol.bid,
    symbol.ask,
    symbol.point,
    symbol.tickSize,
    symbol.tickValue,
    symbol.volumeMin,
    symbol.volumeMax,
    symbol.volumeStep,
    quotedAt,
  ]);
}

export async function saveHeartbeat(heartbeat: Mt5Heartbeat) {
  if (!isDatabaseConfigured()) return false;
  await ensureSchema();
  await Promise.all([
    neonQuery(`
      INSERT INTO sentry_mt5_account_state (
        singleton_id, account_id, server, currency, balance,
        equity, margin_free, server_time, received_at
      ) VALUES (1, $1, $2, $3, $4, $5, $6, $7::timestamptz, now())
      ON CONFLICT (singleton_id) DO UPDATE SET
        account_id = EXCLUDED.account_id,
        server = EXCLUDED.server,
        currency = EXCLUDED.currency,
        balance = EXCLUDED.balance,
        equity = EXCLUDED.equity,
        margin_free = EXCLUDED.margin_free,
        server_time = EXCLUDED.server_time,
        received_at = now()
    `, [
      heartbeat.accountId,
      heartbeat.server,
      heartbeat.currency,
      heartbeat.balance,
      heartbeat.equity,
      heartbeat.marginFree,
      heartbeat.serverTime,
    ]),
    ...heartbeat.symbols.map((symbol) => saveSymbol(symbol, heartbeat.serverTime)),
  ]);
  return true;
}

export async function saveSnapshot(snapshot: Mt5Snapshot) {
  if (!isDatabaseConfigured()) return false;
  await ensureSchema();
  await Promise.all(snapshot.symbols.map((symbol) => saveSymbol(symbol, snapshot.sentAt)));
  return true;
}

export async function saveTrade(envelope: Mt5TradeEnvelope) {
  if (!isDatabaseConfigured()) return false;
  await ensureSchema();
  const deal = envelope.deal;
  await neonQuery(`
    INSERT INTO sentry_mt5_deals (
      ticket, order_id, position_id, symbol, deal_type, entry_type,
      volume, price, profit, commission, swap, dealt_at, comment, received_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::timestamptz, $13, now())
    ON CONFLICT (ticket) DO NOTHING
  `, [
    deal.ticket,
    deal.order,
    deal.positionId,
    deal.symbol,
    deal.type,
    deal.entry,
    deal.volume,
    deal.price,
    deal.profit,
    deal.commission,
    deal.swap,
    deal.time,
    deal.comment,
  ]);
  return true;
}

export async function getLiveMt5State(): Promise<Mt5LiveState> {
  if (!isDatabaseConfigured()) {
    return {
      storageConfigured: false,
      connection: "unconfigured",
      receivedAt: null,
      account: null,
      symbols: [],
      recentDeals: [],
    };
  }

  await ensureSchema();
  const [accountRows, symbolRows, dealRows] = await Promise.all([
    neonQuery(`
      SELECT
        account_id,
        server,
        currency,
        balance::text,
        equity::text,
        margin_free::text,
        server_time::text,
        received_at::text
      FROM sentry_mt5_account_state
      WHERE singleton_id = 1
    `),
    neonQuery(`
      SELECT
        symbol,
        bid::text,
        ask::text,
        point::text,
        tick_size::text,
        tick_value::text,
        volume_min::text,
        volume_max::text,
        volume_step::text,
        quoted_at::text
      FROM sentry_mt5_symbol_state
      ORDER BY symbol
    `),
    neonQuery(`
      SELECT
        ticket,
        order_id,
        position_id,
        symbol,
        deal_type::text,
        entry_type::text,
        volume::text,
        price::text,
        profit::text,
        commission::text,
        swap::text,
        dealt_at::text,
        comment
      FROM sentry_mt5_deals
      ORDER BY dealt_at DESC
      LIMIT 20
    `),
  ]);

  const accountRow = accountRows[0];
  const receivedAt = accountRow?.received_at ?? null;
  const age = receivedAt ? Date.now() - new Date(receivedAt).getTime() : Number.POSITIVE_INFINITY;
  const connection = !accountRow ? "offline" : age <= 30_000 ? "live" : "stale";

  const recentDeals: Mt5Deal[] = dealRows.map((row) => ({
    ticket: row.ticket ?? "",
    order: row.order_id ?? "",
    positionId: row.position_id ?? "",
    symbol: row.symbol ?? "",
    type: numberValue(row.deal_type),
    entry: numberValue(row.entry_type),
    volume: numberValue(row.volume),
    price: numberValue(row.price),
    profit: numberValue(row.profit),
    commission: numberValue(row.commission),
    swap: numberValue(row.swap),
    time: row.dealt_at ?? "",
    comment: row.comment ?? "",
  }));

  return {
    storageConfigured: true,
    connection,
    receivedAt,
    account: accountRow ? {
      maskedId: maskAccountId(accountRow.account_id ?? ""),
      server: accountRow.server ?? "",
      currency: accountRow.currency ?? "",
      balance: numberValue(accountRow.balance),
      equity: numberValue(accountRow.equity),
      marginFree: numberValue(accountRow.margin_free),
      serverTime: accountRow.server_time ?? "",
    } : null,
    symbols: symbolRows.map((row) => ({
      name: row.symbol ?? "",
      bid: numberValue(row.bid),
      ask: numberValue(row.ask),
      point: numberValue(row.point),
      tickSize: numberValue(row.tick_size),
      tickValue: numberValue(row.tick_value),
      volumeMin: numberValue(row.volume_min),
      volumeMax: numberValue(row.volume_max),
      volumeStep: numberValue(row.volume_step),
      quotedAt: row.quoted_at ?? "",
    })),
    recentDeals,
  };
}
