"use client";

import { useEffect, useState } from "react";
import type { Mt5LiveState } from "@/lib/types";

const initialState: Mt5LiveState = {
  storageConfigured: true,
  connection: "offline",
  receivedAt: null,
  account: null,
  symbols: [],
  recentDeals: [],
};

export function useMt5Live() {
  const [state, setState] = useState<Mt5LiveState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    let timer: number | null = null;

    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/mt5/live", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Live state returned ${response.status}.`);
        const nextState = await response.json() as Mt5LiveState;
        if (active) setState(nextState);
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) {
          setState((current) => ({ ...current, connection: "error" }));
        }
      } finally {
        if (active) {
          setLoading(false);
          timer = window.setTimeout(load, 5_000);
        }
      }
    };

    void load();
    return () => {
      active = false;
      controller?.abort();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  return { loading, state };
}
