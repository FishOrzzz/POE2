"use client";

import { useEffect, useState } from "react";

interface Status {
  label: string;
  message: string;
  wrapperClass: string;
  dotClass: string;
}

function getStatus(minutes: number): Status {
  const safeMinutes = Math.max(minutes, 0);

  if (safeMinutes < 20) {
    return {
      label: "Fresh",
      message: `Updated ${safeMinutes}m ago`,
      wrapperClass:
        "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
      dotClass: "bg-emerald-500",
    };
  }

  if (safeMinutes < 45) {
    return {
      label: "Aging",
      message: `Updated ${safeMinutes}m ago — treat with caution`,
      wrapperClass:
        "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
      dotClass: "bg-amber-500",
    };
  }

  return {
    label: "Stale",
    message: `Updated ${safeMinutes}m ago — likely outdated, verify in-game before flipping`,
    wrapperClass:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    dotClass: "bg-red-500",
  };
}

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function FreshnessBanner({ generatedAt }: { generatedAt: string }) {
  const [minutes, setMinutes] = useState(() => minutesSince(generatedAt));

  useEffect(() => {
    const interval = setInterval(() => setMinutes(minutesSince(generatedAt)), 15000);
    return () => clearInterval(interval);
  }, [generatedAt]);

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
