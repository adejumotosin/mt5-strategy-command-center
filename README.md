# Sentry Trading Command OS

A focused trading dashboard for the refined USTEC and EURGBP playbook. It combines pre-trade validation, broker-aware risk sizing, a local trade journal, performance analytics, session timing, durable Neon storage, and a read-only MetaTrader 5 bridge.

> This software is a decision-support and journaling tool, not financial advice. The included EA cannot place, modify, or close trades.

## What is included

- **Command centre** — Nigerian, London, and New York session clocks, instrument focus, setup readiness, risk state, and a concise daily plan.
- **Setup validator** — instrument-specific rules with hard blockers before a setup can be marked valid.
- **Position calculator** — calculates risk amount, stop distance, broker volume, and a 4R target while enforcing a 0.5% risk ceiling.
- **Trade journal** — browser-persisted entries for USTEC and EURGBP with setup, result, R multiple, plan adherence, and notes.
- **Analytics** — win rate, expectancy, profit factor, drawdown, adherence, equity curve, and per-instrument breakdowns.
- **MT5 bridge** — authenticated ingestion endpoints, durable account/symbol/deal state, live dashboard polling, and downloadable `StrategyBridgeEA.mq5` source for MetaQuotes-Demo.

## Instruments and timing

| Strategy market | MetaTrader 5 symbol | Primary window |
| --- | --- | --- |
| US100 | `USTEC` | **1:30–5:30 p.m. Nigerian time** |
| EUR/GBP | `EURGBP` | London session |

The dashboard keeps the US100 rule fixed at 1:30–5:30 p.m. in `Africa/Lagos`. Its reference clocks still use `Africa/Lagos`, `Europe/London`, and `America/New_York` IANA time zones so each market clock handles daylight-saving changes correctly.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before enabling MT5 ingestion, replace `MT5_BRIDGE_TOKEN` with a long random value. Never commit `.env.local` or paste MetaTrader credentials into the dashboard.

Connect Neon Postgres through the Vercel Marketplace so Vercel supplies `DATABASE_URL`. The application creates its three `sentry_mt5_*` tables automatically on the first live request.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## MT5 setup

The repository contains the editable EA source at [`public/StrategyBridgeEA.mq5`](public/StrategyBridgeEA.mq5). MetaTrader creates the `.ex5` binary locally after compilation:

1. Download the source from the dashboard's **MT5 connection** page.
2. Open it in MetaEditor with `F4`.
3. Compile with `F7`.
4. Add the deployed dashboard origin under **Tools → Options → Expert Advisors → Allow WebRequest for listed URL**.
5. Attach the EA to one chart and configure the dashboard URL, bridge token, `USTEC`, and `EURGBP`.

See [`docs/MT5_SETUP.md`](docs/MT5_SETUP.md) for the complete checklist.

## Bridge API

All MT5 routes require `Authorization: Bearer <MT5_BRIDGE_TOKEN>` and validate the JSON payload before accepting it.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Deployment health check |
| `POST` | `/api/mt5/heartbeat` | Account status and symbol specifications |
| `POST` | `/api/mt5/snapshot` | Current USTEC and EURGBP ticks |
| `POST` | `/api/mt5/trades` | New MT5 deal notifications |
| `GET` | `/api/mt5/live` | Latest persisted account, quote, and deal state |

Heartbeat, quote, and deal payloads are authenticated, fully validated, and saved to Neon. Quote rows are updated in place, which preserves the current live state without creating a permanent database row every five seconds. MT5 deals are stored once by ticket number.

## Deployment

The application is designed for Vercel's Next.js runtime.

1. Import the GitHub repository into Vercel.
2. Add `MT5_BRIDGE_TOKEN` to Production, Preview, and Development as appropriate.
3. Connect Neon Postgres and confirm that `DATABASE_URL` is available to the project.
4. Deploy.
5. Put the final HTTPS origin into both MT5's WebRequest allowlist and the EA's `DashboardUrl` input.

## Safety boundaries

- Maximum planned risk is fixed at **0.5% per trade**.
- The EA contains no `OrderSend`, position modification, or close functions.
- Strategy validation and position sizing are decision support; orders remain manual in MetaTrader 5.
- Manually entered journal notes remain in the user's browser via versioned `localStorage`; MT5 account, symbol, and deal telemetry is stored in Neon.
