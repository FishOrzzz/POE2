import { EconomyDataset } from "./poeNinja";
import { BenchmarkCurrencyId } from "./poeNinjaTypes";

// Minimum volume (in divine-equivalent) on BOTH sides of a flip before it's
// considered real signal rather than illiquid noise. Only applied when
// building the ranked pool (computeFlips) - NOT inside evaluateItem, so a
// manually-overridden single item always shows its real computed number
// rather than silently disappearing for failing a floor it never asked to be
// judged against.
const MIN_LIQUIDITY = 20;

const TOP_N = 20;
const TOP_VOLUME_REFERENCE_N = 5;

// Currency-per-1-divine benchmark rates. Divine itself is implicit (always 1).
export type RateMap = Partial<Record<BenchmarkCurrencyId, number>>;

// A manual per-item override: currencyId -> user-entered rate for that item.
export type ItemOverride = Partial<Record<string, number>>;

export interface PoolItemPairHistoryPoint {
  timestamp: string;
  rate: number;
  volume: number;
}

export interface PoolItemPair {
  currencyId: string;
  rate: number;
  volume: number;
  history: PoolItemPairHistoryPoint[];
}

// Raw, unranked candidate data - shipped to the client so ratio overrides can
// recompute the whole pool, not just relabel an already-fixed top 20.
export interface PoolItem {
  id: string;
  name: string;
  image: string;
  category: string;
  pairs: PoolItemPair[];
}

export interface FlipOpportunity {
  id: string;
  name: string;
  image: string;
  category: string;
  buyCurrency: string;
  buyRate: number;
  buyDivineEquivalent: number;
  sellCurrency: string;
  sellRate: number;
  sellDivineEquivalent: number;
  divineProfitPerFlip: number;
  profitPercent: number;
  volume: number;
  volumeRank: number;
  volumePoolSize: number;
}

export type RankMetric = "divine" | "percent";

export interface FlipResult {
  all: FlipOpportunity[];
  topByVolume: FlipOpportunity[];
  poolSize: number;
}

export function buildPool(dataset: EconomyDataset): PoolItem[] {
  const pool: PoolItem[] = [];
  for (const { candidate, details } of dataset.details) {
    // A single-pair item has no arbitrage spread (evaluateItem needs 2+ to
    // produce a result), but it still has a valid price *trend* - keep it so
    // trend-focused consumers aren't starved of candidates.
    if (details.pairs.length < 1) continue;
    pool.push({
      id: candidate.id,
      name: candidate.name,
      image: candidate.image,
      category: candidate.category,
      pairs: details.pairs.map((p) => ({
        currencyId: p.id,
        rate: p.rate,
        volume: p.volumePrimaryValue,
        history: p.history.map((h) => ({
          timestamp: h.timestamp,
          rate: h.rate,
          volume: h.volumePrimaryValue,
        })),
      })),
    });
  }
  return pool;
}

function toDivineEquivalent(currencyId: string, rate: number, rates: RateMap): number | null {
  if (currencyId === "divine") return rate;
  const perDivine = rates[currencyId as BenchmarkCurrencyId];
  if (!perDivine || perDivine <= 0) return null;
  return rate / perDivine;
}

type RawOpportunity = Omit<FlipOpportunity, "volumeRank" | "volumePoolSize">;

// Pure per-item calculation: given an item's raw pairs, the current benchmark
// rates, and an optional manual override, works out the best buy/sell route
// and its profit. Reused both when building the ranked pool (no override) and
// for a single manually-edited row in the browser (with override) - same math
// either way, so results are always consistent.
export function evaluateItem(item: PoolItem, rates: RateMap, override?: ItemOverride): RawOpportunity | null {
  const currencyIds = new Set<string>([...item.pairs.map((p) => p.currencyId), ...Object.keys(override ?? {})]);

  const withDivineEq: { currencyId: string; rate: number; volume: number; divineEq: number }[] = [];
  for (const currencyId of currencyIds) {
    const overrideRate = override?.[currencyId];
    const rawPair = item.pairs.find((p) => p.currencyId === currencyId);
    const rate = overrideRate ?? rawPair?.rate;
    if (rate === undefined || rate <= 0) continue;

    const divineEq = toDivineEquivalent(currencyId, rate, rates);
    if (divineEq === null || divineEq <= 0) continue;

    withDivineEq.push({ currencyId, rate, volume: rawPair?.volume ?? 0, divineEq });
  }

  if (withDivineEq.length < 2) return null;

  const cheapest = withDivineEq.reduce((a, b) => (b.divineEq < a.divineEq ? b : a));
  const priciest = withDivineEq.reduce((a, b) => (b.divineEq > a.divineEq ? b : a));
  if (cheapest.currencyId === priciest.currencyId) return null;

  const divineProfitPerFlip = priciest.divineEq - cheapest.divineEq;
  if (!Number.isFinite(divineProfitPerFlip) || divineProfitPerFlip <= 0) return null;

  return {
    id: item.id,
    name: item.name,
    image: item.image,
    category: item.category,
    buyCurrency: cheapest.currencyId,
    buyRate: cheapest.rate,
    buyDivineEquivalent: cheapest.divineEq,
    sellCurrency: priciest.currencyId,
    sellRate: priciest.rate,
    sellDivineEquivalent: priciest.divineEq,
    divineProfitPerFlip,
    profitPercent: (divineProfitPerFlip / cheapest.divineEq) * 100,
    volume: Math.min(cheapest.volume, priciest.volume),
  };
}

// Builds the whole valid, liquidity-filtered pool (ranked by volume) and the
// top-5-by-volume reference list at a given rate set. This is what re-runs
// whenever the global ratio override changes - pure and framework-agnostic,
// so it runs identically on the server (initial paint) and in the browser
// (recompute). Deliberately does NOT slice to a top-20-by-profit list here -
// that depends on which ranking metric is currently selected, which is a
// display concern handled by rankTopFlips.
export function computeFlips(pool: PoolItem[], rates: RateMap): FlipResult {
  const opportunities: RawOpportunity[] = [];

  for (const item of pool) {
    const evaluated = evaluateItem(item, rates);
    if (!evaluated) continue;
    if (evaluated.volume < MIN_LIQUIDITY) continue;
    opportunities.push(evaluated);
  }

  // Rank by volume (liquidity) across the whole discovered pool first, so every
  // flip - not just the ones shown - carries an honest "how liquid is this
  // relative to everything else we found" position. This ranking is stable
  // regardless of which profit metric is used to pick the top 20.
  const rankedByVolume = [...opportunities].sort((a, b) => b.volume - a.volume);
  const volumeRankById = new Map(rankedByVolume.map((o, i) => [o.id, i + 1]));
  const poolSize = opportunities.length;

  const all: FlipOpportunity[] = opportunities.map((o) => ({
    ...o,
    volumeRank: volumeRankById.get(o.id) ?? poolSize,
    volumePoolSize: poolSize,
  }));

  const topByVolume = [...all].sort((a, b) => b.volume - a.volume).slice(0, TOP_VOLUME_REFERENCE_N);

  return { all, topByVolume, poolSize };
}

// Picks the top 20 from the full pool by whichever metric the user has
// selected - "divine" (raw Divine profit per flip) or "percent" (profit %).
export function rankTopFlips(all: FlipOpportunity[], metric: RankMetric): FlipOpportunity[] {
  const key: keyof FlipOpportunity = metric === "divine" ? "divineProfitPerFlip" : "profitPercent";
  return [...all].sort((a, b) => (b[key] as number) - (a[key] as number)).slice(0, TOP_N);
}
