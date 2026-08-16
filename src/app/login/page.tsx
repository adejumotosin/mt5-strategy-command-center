import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { hasDashboardSession, isDashboardAuthConfigured } from "@/lib/dashboard-auth";

export const metadata: Metadata = {
  title: "Private Access | Sentry TradeOS",
  robots: { index: false, follow: false },
};

function safeNextPath(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.startsWith("/login") ? value : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await hasDashboardSession()) redirect("/");
  const { next } = await searchParams;

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <span className="brand-mark"><i/><i/><i/></span>
          <div><strong>SENTRY</strong><small>Trading Command OS</small></div>
        </div>
        <span className="eyebrow">Private workspace</span>
        <h1>Authorised access only</h1>
        <p>Enter your dashboard password to view live MT5 account, market, and strategy data.</p>
        <LoginForm configured={isDashboardAuthConfigured()} nextPath={safeNextPath(next)} />
        <div className="login-security"><span><i/></span><p><strong>Read-only boundary</strong><small>This dashboard cannot place, modify, or close trades.</small></p></div>
      </section>
    </main>
  );
}
