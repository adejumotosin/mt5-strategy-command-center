# Connect MetaQuotes-Demo to Sentry TradeOS

## Compile the bridge

1. Download `StrategyBridgeEA.mq5` from the dashboard connection page.
2. In MetaTrader 5, press `F4` to open MetaEditor.
3. Select **File → Open** and choose the downloaded source.
4. Press `F7` to compile it.
5. Confirm that MetaEditor reports zero errors.

The compiled `StrategyBridgeEA.ex5` file will appear inside the terminal's `MQL5/Experts` directory.

## Permit secure requests

1. In MetaTrader 5, open **Tools → Options → Expert Advisors**.
2. Enable **Allow WebRequest for listed URL**.
3. Add the exact production Vercel origin, without a trailing slash.

## Attach the bridge

1. Return to MetaTrader 5.
2. In Navigator, right-click **Expert Advisors** and select **Refresh**.
3. Drag `StrategyBridgeEA` onto one chart.
4. Enter the production URL and the same private token configured in Vercel as `MT5_BRIDGE_TOKEN`.
5. Keep `USTECSymbol=USTEC` and `EURGBPSymbol=EURGBP` for MetaQuotes-Demo.

The Experts log will report accepted requests or explain the exact configuration problem. Never paste your MetaTrader password into the EA or dashboard.
