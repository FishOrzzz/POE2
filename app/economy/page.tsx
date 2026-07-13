import type { Metadata } from "next";
import AnchorDashboard from "@/components/AnchorDashboard";
import FreshnessBanner from "@/components/FreshnessBanner";
import TrendScanner from "@/components/TrendScanner";
import { buildPool } from "@/lib/arbitrage";
import { AnchorPoint, buildTrendScanner, deriveDivineChaosRatioHistory, getAnchorSeries, NamedSeries, ScannerSort, TrendEntry } from "@/lib/economy";
import { fetchEconomyDataset } from "@/lib/poeNinja";

export const metadata: Metadata = {
  title: "Economy Analyzer — POE2 Toolbox",
  description: "Season trends, anchor prices, and gainers/losers for the current Path of Exile 2 league.",
};

// Matches poe.ninja's own hourly PoE2 refresh cadence. The underlying
// poe.ninja fetch is separately cache-scoped (lib/poeNinja.ts) so this stays
// honored even though this page reads searchParams for the sort toggle.
export const revalidate = 3600;

const VALID_SORTS: ScannerSort[] = ["gainers", "losers", "volatile", "steady"];

function parseSort(value: string | undefined): ScannerSort {
  return VALID_SORTS.includes(value as ScannerSort) ? (value as ScannerSort) : "gainers";
}

export default async function EconomyPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: sortParam } = await searchParams;
  const sort = parseSort(sortParam);

  let league = "";
  let error: string | null = null;
  let divineChaosRatio: AnchorPoint[] = [];
  let anchorSeries: NamedSeries[] = [];
  let scannerEntries: TrendEntry[] = [];

  try {
    const dataset = await fetchEconomyDataset();
    const pool = buildPool(dataset);
    league = dataset.league;
    divineChaosRatio = deriveDivineChaosRatioHistory(pool);
    anchorSeries = getAnchorSeries(pool);
    scannerEntries = buildTrendScanner(pool, sort);
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load economy data";
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Economy Analyzer</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Season-to-date trends and patterns from the current league{league ? ` — ${league}` : ""}.
        </p>
      </header>

      <FreshnessBanner />

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Couldn&apos;t load data from poe.ninja right now: {error}
        </p>
      ) : (
        <>
          <AnchorDashboard divineChaosRatio={divineChaosRatio} anchorSeries={anchorSeries} />
          <TrendScanner entries={scannerEntries} activeSort={sort} />
        </>
      )}

      <footer className="mt-4 flex flex-col gap-2 text-xs text-zinc-400 dark:text-zinc-600">
        <p>
          Reflects the current season&apos;s observed pattern only. Without cross-season archiving,
          &quot;this happens every season&quot; stays an informed hypothesis here, not a validated claim.
        </p>
        <p>
          Data via{" "}
          <a href="https://poe.ninja" className="underline" target="_blank" rel="noopener noreferrer">
            poe.ninja
          </a>
          . Not affiliated with Grinding Gear Games.
        </p>
      </footer>
    </div>
  );
}
