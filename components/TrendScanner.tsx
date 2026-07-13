import Link from "next/link";
import TrendTag from "@/components/TrendTag";
import { formatRate, getCurrencyStyle, getItemIconUrl, getRankAccentColor } from "@/lib/currencyDisplay";
import { ScannerSort, TrendEntry } from "@/lib/economy";

const SORT_OPTIONS: { value: ScannerSort; label: string }[] = [
  { value: "gainers", label: "Top Gainers" },
  { value: "losers", label: "Top Losers" },
  { value: "volatile", label: "Most Volatile" },
  { value: "steady", label: "Steadiest" },
];

function formatChange(change: number | null): string {
  if (change === null) return "—";
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

export default function TrendScanner({ entries, activeSort }: { entries: TrendEntry[]; activeSort: ScannerSort }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map((option) => {
          const active = option.value === activeSort;
          return (
            <Link
              key={option.value}
              href={`/economy?sort=${option.value}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-sky-600 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Not enough data yet this season.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {entries.map((entry, i) => {
            const accentColor = getRankAccentColor(i, entries.length);
            const currencyStyle = getCurrencyStyle(entry.currencyId);
            return (
              <li
                key={entry.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:gap-5"
                style={{ borderLeftWidth: 5, borderLeftColor: accentColor }}
              >
                <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    {i + 1}
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getItemIconUrl(entry.image)} alt="" width={28} height={28} className="shrink-0 rounded" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{entry.name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{entry.category}</p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${currencyStyle.bgClass} ${currencyStyle.textClass}`}
                    >
                      {formatRate(entry.currentRate)} {currencyStyle.label}
                    </span>
                    <TrendTag direction={entry.direction} />
                  </div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">{entry.hint}</p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:w-32 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {formatChange(entry.change7d)} <span className="text-xs font-normal text-zinc-400">7d</span>
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatChange(entry.change14d)} 14d</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
