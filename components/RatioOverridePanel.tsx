"use client";

import { RateMap } from "@/lib/arbitrage";

interface Props {
  ratioOverride: RateMap;
  defaultRates: RateMap;
  hasAnyOverride: boolean;
  onChange: (field: "chaos" | "exalted", value: string) => void;
  onClearRatios: () => void;
  onClearAll: () => void;
}

function RatioInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
      {label}
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-32 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
      />
    </label>
  );
}

export default function RatioOverridePanel({
  ratioOverride,
  defaultRates,
  hasAnyOverride,
  onChange,
  onClearRatios,
  onClearAll,
}: Props) {
  const chaosValue = ratioOverride.chaos !== undefined ? String(ratioOverride.chaos) : "";
  const exaltedValue = ratioOverride.exalted !== undefined ? String(ratioOverride.exalted) : "";
  const ratiosActive = ratioOverride.chaos !== undefined || ratioOverride.exalted !== undefined;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Manual ratio override
            </p>
            <div className="flex gap-3">
              <RatioInput
                label="Chaos per Divine"
                value={chaosValue}
                placeholder={defaultRates.chaos !== undefined ? defaultRates.chaos.toFixed(2) : "—"}
                onChange={(v) => onChange("chaos", v)}
              />
              <RatioInput
                label="Exalted per Divine"
                value={exaltedValue}
                placeholder={defaultRates.exalted !== undefined ? defaultRates.exalted.toFixed(0) : "—"}
                onChange={(v) => onChange("exalted", v)}
              />
            </div>
          </div>
          {ratiosActive && (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              Using manual ratio
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClearRatios}
            disabled={!ratiosActive}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear ratios
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={!hasAnyOverride}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Clear all overrides
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        Enter what you currently see in-game to re-rank every flip with live ratios instead of
        poe.ninja&apos;s hourly snapshot. Leave blank to use the API value.
      </p>
    </div>
  );
}
