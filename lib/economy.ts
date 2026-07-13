import { PoolItem } from "./arbitrage";

// Pure trend/pattern analysis over the current season's data only - no
// archiving, no cross-season storage. Everything here reads from the same
// PoolItem[] the flip finder already builds (lib/poeNinja.ts's
// fetchEconomyDataset + lib/arbitrage.ts's buildPool), just consuming the
// `history` field that tool ignores.

export interface AnchorPoint {
  timestamp: string;
  value: number;
}

export interface NamedSeries {
  id: string;
  name: string;
  points: AnchorPoint[];
}

export type TrendDirection = "rising" | "falling" | "volatile" | "flat";

export interface TrendEntry {
  id: string;
  name: string;
  image: string;
  category: string;
  currencyId: string;
  currentRate: number;
  change7d: number | null;
  change14d: number | null;
  volatility: number | null;
  volume: number;
  direction: TrendDirection;
  hint: string;
}

export type ScannerSort = "gainers" | "losers" | "volatile" | "steady";

// Divine and Chaos have no /details entry of their own (confirmed directly -
// both 404), so their historical cross-rate has to be derived from an item
// that trades in both. Picked dynamically each run rather than hardcoded to
// one item, so it self-adapts if trading patterns shift between leagues.
export function deriveDivineChaosRatioHistory(pool: PoolItem[]): AnchorPoint[] {
  let best: { overlap: Map<string, number>; score: number } | null = null;

  for (const item of pool) {
    const divinePair = item.pairs.find((p) => p.currencyId === "divine");
    const chaosPair = item.pairs.find((p) => p.currencyId === "chaos");
    if (!divinePair || !chaosPair) continue;
    if (divinePair.history.length < 2 || chaosPair.history.length < 2) continue;

    const divineByDate = new Map(divinePair.history.map((h) => [h.timestamp, h.rate]));
    const overlap = new Map<string, number>();
    for (const h of chaosPair.history) {
      const divineRate = divineByDate.get(h.timestamp);
      if (divineRate && divineRate > 0 && h.rate > 0) {
        overlap.set(h.timestamp, h.rate / divineRate);
      }
    }

    // Favor candidates with more overlapping days AND more volume on the
    // thinner of the two pairs - a wide but illiquid overlap is less
    // trustworthy than a shorter but well-traded one.
    const score = overlap.size * Math.min(divinePair.volume, chaosPair.volume);
    if (overlap.size >= 2 && (!best || score > best.score)) {
      best = { overlap, score };
    }
  }

  if (!best) return [];

  return [...best.overlap.entries()]
    .map(([timestamp, value]) => ({ timestamp, value }))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// Mirror of Kalandra and Hinekora's Lock are consistently high-volume enough
// to already be in the top-50-by-volume pool the flip finder fetches - no
// extra request needed to chart them. Note: these are poe.ninja's short `id`
// values (what PoolItem.id actually holds), not the `detailsId` URL slug -
// they're usually the same but NOT for Mirror, whose id is just "mirror"
// (confirmed directly against the live API; using "mirror-of-kalandra" here
// silently dropped it from the chart).
const ANCHOR_ITEM_IDS = ["mirror", "hinekoras-lock"];

export function getAnchorSeries(pool: PoolItem[]): NamedSeries[] {
  const series: NamedSeries[] = [];
  for (const id of ANCHOR_ITEM_IDS) {
    const item = pool.find((p) => p.id === id);
    if (!item) continue;
    const divinePair = item.pairs.find((p) => p.currencyId === "divine");
    if (!divinePair || divinePair.history.length < 2) continue;

    const points = [...divinePair.history]
      .map((h) => ({ timestamp: h.timestamp, value: h.rate }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    series.push({ id: item.id, name: item.name, points });
  }
  return series;
}

function pctChange(current: number, past: number): number {
  return ((current - past) / past) * 100;
}

function stdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// Thresholds are simple and explicit on purpose - this is a descriptive
// heuristic, not a model. Volatility takes priority over direction since a
// wildly swinging price makes "rising" or "falling" a less useful label.
const RISING_THRESHOLD = 10;
const FALLING_THRESHOLD = -10;
const VOLATILITY_THRESHOLD = 8;

function classify(change7d: number | null, volatility: number | null): { direction: TrendDirection; hint: string } {
  if (volatility !== null && volatility >= VOLATILITY_THRESHOLD) {
    return {
      direction: "volatile",
      hint: "Swinging a lot day to day - riskier to hold, but there may be an opportunity if you can time it.",
    };
  }
  if (change7d === null) {
    return { direction: "flat", hint: "Not enough history yet this season to call a trend." };
  }
  if (change7d >= RISING_THRESHOLD) {
    return { direction: "rising", hint: "Rising over the last week - may be worth holding a bit longer." };
  }
  if (change7d <= FALLING_THRESHOLD) {
    return { direction: "falling", hint: "Falling over the last week - consider selling before it drops further." };
  }
  return { direction: "flat", hint: "Roughly steady over the last week." };
}

// Per-item trend computation. Uses whichever of the item's currency pairs is
// most actively traded (highest volume) as the trend series - that's the
// most reliable signal, and naturally tends to be the divine pair for
// popular items. Deliberately does NOT convert to divine-equivalent using
// today's rates: a raw same-currency series over time is what actually shows
// "chaos is gaining value" or "exalted is inflating" - converting through a
// single current rate would erase exactly the signal this tool is for.
export function computeTrendMetrics(item: PoolItem): TrendEntry | null {
  const pair = [...item.pairs].filter((p) => p.history.length >= 2).sort((a, b) => b.volume - a.volume)[0];
  if (!pair) return null;

  // poe.ninja returns history newest-first (index 0 = most recent day).
  const history = pair.history;
  const current = history[0].rate;

  const change7d = history.length > 7 && history[7].rate > 0 ? pctChange(current, history[7].rate) : null;
  const change14d = history.length > 14 && history[14].rate > 0 ? pctChange(current, history[14].rate) : null;

  const window = history.slice(0, Math.min(14, history.length));
  const dailyReturns: number[] = [];
  for (let i = 0; i < window.length - 1; i++) {
    if (window[i + 1].rate > 0) {
      dailyReturns.push(pctChange(window[i].rate, window[i + 1].rate));
    }
  }
  const volatility = dailyReturns.length >= 2 ? stdDev(dailyReturns) : null;

  const { direction, hint } = classify(change7d, volatility);

  return {
    id: item.id,
    name: item.name,
    image: item.image,
    category: item.category,
    currencyId: pair.currencyId,
    currentRate: current,
    change7d,
    change14d,
    volatility,
    volume: pair.volume,
    direction,
    hint,
  };
}

// Same liquidity floor as the flip finder's arbitrage pool, applied here so
// the scanner doesn't surface noise from barely-traded items.
const MIN_SCANNER_VOLUME = 20;

export function buildTrendScanner(pool: PoolItem[], sort: ScannerSort, limit = 20): TrendEntry[] {
  const entries: TrendEntry[] = [];
  for (const item of pool) {
    const metrics = computeTrendMetrics(item);
    if (metrics && metrics.volume >= MIN_SCANNER_VOLUME) entries.push(metrics);
  }

  switch (sort) {
    case "gainers":
      return entries
        .filter((e) => e.change7d !== null)
        .sort((a, b) => (b.change7d as number) - (a.change7d as number))
        .slice(0, limit);
    case "losers":
      return entries
        .filter((e) => e.change7d !== null)
        .sort((a, b) => (a.change7d as number) - (b.change7d as number))
        .slice(0, limit);
    case "volatile":
      return entries
        .filter((e) => e.volatility !== null)
        .sort((a, b) => (b.volatility as number) - (a.volatility as number))
        .slice(0, limit);
    case "steady":
      return entries
        .filter((e) => e.volatility !== null)
        .sort((a, b) => (a.volatility as number) - (b.volatility as number))
        .slice(0, limit);
  }
}
