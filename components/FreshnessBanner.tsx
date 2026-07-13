"use client";

import { useEffect, useState } from "react";

interface Status {
  label: string;
  message: string;
  wrapperClass: string;
  dotClass: string;
}

// poe.ninja exposes no "last synced from GGG" timestamp anywhere (checked both
// the API responses and their own site). Their docs only say PoE2 data
// refreshes "roughly hourly," so the best honest estimate of data age is time
// elapsed since the top of the current UTC hour - not time since we fetched it,
// which would understate staleness if our fetch happened late in the hour.
function minutesIntoCurrentHour(): number {
  return new Date().getUTCMinutes();
}

function getStatus(minutes: number): Status {
  if (minutes < 20) {
    return {
      label: "Fresh",
      message: `~${minutes}m into poe.ninja's hourly refresh window`,
      wrapperClass:
        "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
    };
  }

  if (minutes < 45) {
    return {
      label: "Aging",
      message: `~${minutes}m into poe.ninja's hourly refresh window — treat with caution`,
      wrapperClass:
        "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
      dotClass: "bg-amber-500",
    };
  }

  return {
    label: "Stale",
    message: `~${minutes}m into poe.ninja's hourly refresh window — likely outdated, verify in-game before flipping`,
    wrapperClass:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    dotClass: "bg-red-500",
  };
}

export default function FreshnessBanner() {
  const [minutes, setMinutes] = useState(() => minutesIntoCurrentHour());

  useEffect(() => {
    const interval = setInterval(() => setMinutes(minutesIntoCurrentHour()), 15000);
    return () => clearInterval(interval);
  }, []);

  const status = getStatus(minutes);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium ${status.wrapperClass}`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dotClass}`} />
      <span className="font-semibold">{status.label}</span>
      <span className="opacity-90">{status.message}</span>
    </div>
  );
}
