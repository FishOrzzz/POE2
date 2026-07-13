"use client";

import { FlipOpportunity, ItemOverride, PoolItem, RankMetric } from "@/lib/arbitrage";
import { formatRate, getCurrencyStyle, getItemIconUrl, getRankAccentColor } from "@/lib/currencyDisplay";

const EDITABLE_CURRENCIES = ["divine", "exalted", "chaos"] as const;

export interface DisplayRow {
  flip: FlipOpportunity;
  hasOverride: boolean;
  invalidOverride: boolean;
}

interface FlipTableProps {
  rows: DisplayRow[];
  rankMetric: RankMetric;
  poolById: Map<string, PoolItem>;
  itemOverrides: Record<string, ItemOverride>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onItemOverrideChange: (id: string, currencyId: string, value: string) => void;
  onClearItem: (id: string) => void;
}

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

function ItemOverridePanel({
  itemId,
  poolItem,
  override,
  onChange,
  onClear,
}: {
  itemId: string;
  poolItem: PoolItem | undefined;
  override: ItemOverride | undefined;
  onChange: (currencyId: string, value: string) => void;
  onClear: () => void;
}) {
  const hasOverride = !!override && Object.keys(override).length > 0;

  return (
    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/40">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {EDITABLE_CURRENCIES.map((currencyId) => {
            const style = getCurrencyStyle(currencyId);
            const rawPair = poolItem?.pairs.find((p) => p.currencyId === currencyId);
            const value = override?.[currencyId] !== undefined ? String(override[currencyId]) : "";
            return (
              <label key={currencyId} className="flex flex-col gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className={style.textClass}>{style.label} price</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={value}
                  onChange={(e) => onChange(currencyId, e.target.value)}
                  placeholder={rawPair && Number.isFinite(rawPair.rate) ? formatRate(rawPair.rate) : "—"}
                  className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 outline-none focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
              </label>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasOverride}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Clear this item
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
        Enter what you currently see in-game for {itemId}. Leave a field blank to use poe.ninja&apos;s price.
      </p>
    </div>
  );
}

function FlipRow({
  row,
  rank,
  total,
  rankMetric,
  poolItem,
  override,
  expanded,
  onToggleExpand,
  onItemOverrideChange,
  onClearItem,
}: {
  row: DisplayRow;
  rank: number;
  total: number;
  rankMetric: RankMetric;
  poolItem: PoolItem | undefined;
  override: ItemOverride | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
  onItemOverrideChange: (currencyId: string, value: string) => void;
  onClearItem: () => void;
}) {
  const { flip, hasOverride, invalidOverride } = row;
  const accentColor = getRankAccentColor(rank - 1, total);

  return (
    <li
      className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      style={{ borderLeftWidth: 5, borderLeftColor: accentColor }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-start gap-3 sm:w-64 sm:shrink-0">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {rank}
          </span>
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex min-w-0 items-start gap-2 text-left"
            aria-expanded={expanded}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getItemIconUrl(flip.image)}
              alt=""
              width={28}
              height={28}
              className="mt-0.5 shrink-0 rounded"
            />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5 font-semibold text-zinc-900 underline decoration-dotted underline-offset-2 dark:text-zinc-50">
                {flip.name}
                {hasOverride && (
                  <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    Manual
                  </span>
                )}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{flip.category}</p>
            </div>
          </button>
        </div>

        {invalidOverride ? (
          <div className="flex flex-1 items-center text-sm text-red-600 dark:text-red-400">
            No profitable flip with the values entered — need at least 2 valid prices.
          </div>
        ) : (
          <>
            <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
              <span className="text-zinc-500 dark:text-zinc-400">Buy</span>
              <CurrencyBadge currencyId={flip.buyCurrency} rate={flip.buyRate} />
              <span className="text-zinc-400 dark:text-zinc-600">&rarr;</span>
              <span className="text-zinc-500 dark:text-zinc-400">Sell</span>
              <CurrencyBadge currencyId={flip.sellCurrency} rate={flip.sellRate} />
            </div>

            <div className="flex items-center justify-between gap-4 sm:w-44 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
              <span
                className="rounded-full px-3 py-1.5 text-base font-bold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {rankMetric === "divine"
                  ? `+${formatRate(flip.divineProfitPerFlip)} div / flip`
                  : `+${flip.profitPercent.toFixed(1)}% / flip`}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {rankMetric === "divine"
                  ? `+${flip.profitPercent.toFixed(1)}% · ~${formatRate(flip.volume)} div/hr`
                  : `+${formatRate(flip.divineProfitPerFlip)} div/flip · ~${formatRate(flip.volume)} div/hr`}
              </span>
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                Liquidity rank #{flip.volumeRank} of {flip.volumePoolSize}
              </span>
            </div>
          </>
        )}
      </div>

      {expanded && (
        <ItemOverridePanel
          itemId={flip.name}
          poolItem={poolItem}
          override={override}
          onChange={onItemOverrideChange}
          onClear={onClearItem}
        />
      )}
    </li>
  );
}

export default function FlipTable({
  rows,
  rankMetric,
  poolById,
  itemOverrides,
  expandedIds,
  onToggleExpand,
  onItemOverrideChange,
  onClearItem,
}: FlipTableProps) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-6 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        No liquid flip opportunities found right now — check back next hour.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <FlipRow
          key={row.flip.id}
          row={row}
          rank={i + 1}
          total={rows.length}
          rankMetric={rankMetric}
          poolItem={poolById.get(row.flip.id)}
          override={itemOverrides[row.flip.id]}
          expanded={expandedIds.has(row.flip.id)}
          onToggleExpand={() => onToggleExpand(row.flip.id)}
          onItemOverrideChange={(currencyId, value) => onItemOverrideChange(row.flip.id, currencyId, value)}
          onClearItem={() => onClearItem(row.flip.id)}
        />
      ))}
    </ul>
  );
}
