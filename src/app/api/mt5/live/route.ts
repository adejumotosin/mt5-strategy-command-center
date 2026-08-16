import { getLiveMt5State } from "@/lib/mt5-store";
import { hasDashboardSession } from "@/lib/dashboard-auth";

export async function GET() {
  if (!await hasDashboardSession()) {
    return Response.json({ error: "Unauthorized." }, {
      status: 401,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }
  try {
    const state = await getLiveMt5State();
    return Response.json(state, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch (error) {
    console.error("MT5 live state query failed.", error);
    return Response.json({ error: "Live MT5 state is temporarily unavailable." }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  }
}
