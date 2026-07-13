import { FlipOpportunity } from "@/lib/arbitrage";
import { formatRate, getCurrencyStyle, getRankAccentColor } from "@/lib/currencyDisplay";

function CurrencyBadge({ currencyId, rate }: { currencyId: string; rate: number }) {
  const style = getCurrencyStyle(currencyId);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.bgClass} ${style.textClass}`}
    >
      {formatRate(rate)} {style.label}
    </span>
  );
}

function FlipRow({ flip, rank, total }: { flip: FlipOpportunity; rank: number; total: number }) {
  const accentColor = getRankAccentColor(rank - 1, total);

  return (
    <li
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:gap-5"
      style={{ borderLeftWidth: 5, borderLeftColor: accentColor }}
    >
      <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {rank}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://poe.ninja${flip.image}`}
            alt=""
            width={28}
            height={28}
            className="shrink-0 rounded"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-50">{flip.name}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{flip.category}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">Buy</span>
        <CurrencyBadge currencyId={flip.buyCurrency} rate={flip.buyRate} />
        <span className="text-zinc-400 dark:text-zinc-600">&rarr;</span>
        <span className="text-zinc-500 dark:text-zinc-400">Sell</span>
        <CurrencyBadge currencyId={flip.sellCurrency} rate={flip.sellRate} />
      </div>

      <div className="flex items-center justify-between gap-4 sm:w-40 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
        <span
          className="rounded-full px-3 py-1 text-sm font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          +{flip.profitPercent.toFixed(1)}%
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          ~{formatRate(flip.volume)} div volume
        </span>
      </div>
    </li>
  );
}

export default function FlipTable({ flips }: { flips: FlipOpportunity[] }) {
  if (flips.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        No liquid flip opportunities found right now — check back next hour.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {flips.map((flip, i) => (
        <FlipRow key={flip.id} flip={flip} rank={i + 1} total={flips.length} />
      ))}
    </ul>
  );
}
