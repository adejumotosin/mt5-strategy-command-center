"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";

function getTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    hour: Number(map.hour),
    formatted: `${map.hour}:${map.minute}:${map.second}`,
  };
}

export function SessionClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!now) {
    return <div className="session-clock session-clock--loading">Synchronising market clocks…</div>;
  }

  const lagos = getTimeParts(now, "Africa/Lagos");
  const london = getTimeParts(now, "Europe/London");
  const newYork = getTimeParts(now, "America/New_York");
  const londonActive = london.hour >= 8 && london.hour < 11;
  const usActive = newYork.hour >= 8 && newYork.hour < 11;

  return (
    <div className="session-clock">
      <span className="session-clock__icon"><Icon name="clock" /></span>
      <div>
        <small>Lagos</small>
        <strong>{lagos.formatted}</strong>
      </div>
      <span className={`market-dot ${londonActive ? "is-live" : ""}`} />
      <div className="session-clock__market">
        <small>London</small>
        <strong>{london.formatted}</strong>
      </div>
      <span className={`market-dot ${usActive ? "is-live" : ""}`} />
      <div className="session-clock__market">
        <small>New York</small>
        <strong>{newYork.formatted}</strong>
      </div>
    </div>
  );
}
