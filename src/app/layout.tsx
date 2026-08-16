import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentry TradeOS | MT5 Strategy Command Centre",
  description: "A disciplined US100 and EURGBP trading command centre for MetaTrader 5.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
