"use client";

import { RankMetric } from "@/lib/arbitrage";

const OPTIONS: { value: RankMetric; label: string }[] = [
  { value: "divine", label: "Div / flip" },
  { value: "percent", label: "% / flip" },
];

export default function RankMetricToggle({
  value,
  onChange,
}: {
  value: RankMetric;
  onChange: (metric: RankMetric) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Rank by
      </span>
      <div className="inline-flex rounded-lg border border-zinc-300 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-800">
        {OPTIONS.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "bg-sky-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
