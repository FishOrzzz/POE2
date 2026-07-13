import type { Metadata } from "next";
import FlipCalculator from "@/components/FlipCalculator";
import FreshnessBanner from "@/components/FreshnessBanner";
import { buildPool, PoolItem, RateMap } from "@/lib/arbitrage";
import { fetchFlipDataset } from "@/lib/poeNinja";

export const metadata: Metadata = {
  title: "Currency Flip Finder — POE2 Toolbox",
  description: "Top 20 Path of Exile 2 currency exchange flips ranked by profit, updated hourly.",
};

// Matches poe.ninja's own hourly PoE2 refresh cadence - no point revalidating
// more often, it would just re-fetch the same cached upstream data.
export const revalidate = 3600;

export default async function CurrencyFlipPage() {
  let pool: PoolItem[] = [];
  let defaultRates: RateMap = {};
  let league = "";
  let error: string | null = null;

  try {
    const dataset = await fetchFlipDataset();
    pool = buildPool(dataset);
    defaultRates = { chaos: dataset.core.rates.chaos, exalted: dataset.core.rates.exalted };
    league = dataset.league;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load flip data";
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Currency Flip Finder
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Top 20 flips, ranked by Divine profit or profit %, from among the 50 most liquid tradeable
          items{league ? ` — ${league}` : ""}.
        </p>
      </header>

      <FreshnessBanner />

      {error ? (
        <p className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          Couldn&apos;t load data from poe.ninja right now: {error}
        </p>
      ) : (
        <FlipCalculator pool={pool} defaultRates={defaultRates} />
      )}

      <footer className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
        Data via{" "}
        <a href="https://poe.ninja" className="underline" target="_blank" rel="noopener noreferrer">
          poe.ninja
        </a>
        . Volume is a liquidity signal, not a guaranteed available quantity. Not affiliated with
        Grinding Gear Games.
      </footer>
    </div>
  );
}
