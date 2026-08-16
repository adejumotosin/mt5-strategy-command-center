import { DashboardShell } from "@/components/dashboard-shell";
import { redirect } from "next/navigation";
import { hasDashboardSession } from "@/lib/dashboard-auth";

export default async function Home() {
  if (!await hasDashboardSession()) redirect("/login");
  return <DashboardShell />;
}
