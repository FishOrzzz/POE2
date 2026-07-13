import { FlipDataset } from "./poeNinja";
import { CurrencyExchangePair } from "./poeNinjaTypes";

// Minimum volume (in divine-equivalent) on BOTH sides of a flip before it's
// considered real signal rather than illiquid noise.
const MIN_LIQUIDITY = 20;

const TOP_N = 20;

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
}

// Converts a currency-pair's quoted rate (price of 1 item in that currency)
// into a divine-equivalent value using the benchmark cross-rates from the
// overview endpoint's `core.rates` (currency-per-1-divine).
function toDivineEquivalent(pair: CurrencyExchangePair, rates: Record<string, number>): number | null {
  if (pair.id === "divine") return pair.rate;
  const perDivine = rates[pair.id];
  if (!perDivine || perDivine <= 0) return null;
  return pair.rate / perDivine;
}

export function computeTopFlips(dataset: FlipDataset): FlipOpportunity[] {
  const opportunities: FlipOpportunity[] = [];

  for (const { candidate, details } of dataset.details) {
    if (details.pairs.length < 2) continue;

    const withDivineEq = details.pairs
      .map((pair) => ({
        pair,
        divineEq: toDivineEquivalent(pair, dataset.core.rates),
      }))
      .filter((p): p is { pair: CurrencyExchangePair; divineEq: number } => p.divineEq !== null && p.divineEq > 0);

    if (withDivineEq.length < 2) continue;

    const cheapest = withDivineEq.reduce((a, b) => (b.divineEq < a.divineEq ? b : a));
    const priciest = withDivineEq.reduce((a, b) => (b.divineEq > a.divineEq ? b : a));

    if (cheapest.pair.id === priciest.pair.id) continue;

    const volume = Math.min(cheapest.pair.volumePrimaryValue, priciest.pair.volumePrimaryValue);
    if (volume < MIN_LIQUIDITY) continue;

    const divineProfitPerFlip = priciest.divineEq - cheapest.divineEq;
    const profitPercent = (divineProfitPerFlip / cheapest.divineEq) * 100;
    if (!Number.isFinite(divineProfitPerFlip) || divineProfitPerFlip <= 0) continue;

    opportunities.push({
      id: candidate.id,
      name: candidate.name,
      image: candidate.image,
      category: candidate.category,
      buyCurrency: cheapest.pair.id,
      buyRate: cheapest.pair.rate,
      buyDivineEquivalent: cheapest.divineEq,
      sellCurrency: priciest.pair.id,
      sellRate: priciest.pair.rate,
      sellDivineEquivalent: priciest.divineEq,
      divineProfitPerFlip,
      profitPercent,
      volume,
    });
  }

  return opportunities.sort((a, b) => b.divineProfitPerFlip - a.divineProfitPerFlip).slice(0, TOP_N);
}
