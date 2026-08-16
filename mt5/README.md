# MetaTrader 5 bridge

The downloadable source is stored at `public/StrategyBridgeEA.mq5` so every deployment can serve it directly from `/StrategyBridgeEA.mq5`.

The bridge is intentionally read-only. It sends heartbeats, broker symbol specifications, quote snapshots and completed-deal events. It contains no order placement or position modification call.

See `docs/MT5_SETUP.md` for compilation and installation steps.
