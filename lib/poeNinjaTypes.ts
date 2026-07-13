// PoE2 currency-exchange category types accepted by poe.ninja's overview/details endpoints.
export const POE2_EXCHANGE_TYPES = [
  "Currency",
  "Fragments",
  "Abyss",
  "UncutGems",
  "LineageSupportGems",
  "Essences",
  "SoulCores",
  "Idols",
  "Runes",
  "Ritual", // Omens
  "Expedition",
  "Delirium", // Liquid Emotions
  "Breach", // Catalysts
  "Verisium",
] as const;

export type Poe2ExchangeType = (typeof POE2_EXCHANGE_TYPES)[number];

// The three currencies flips are always denominated in.
export const BENCHMARK_CURRENCY_IDS = ["divine", "exalted", "chaos"] as const;
export type BenchmarkCurrencyId = (typeof BENCHMARK_CURRENCY_IDS)[number];

export interface EconomyLeague {
  id: string;
  name: string;
}

export interface CurrencyExchangeCore {
  primary: string;
  secondary: string;
  rates: Record<string, number>;
  items: { id: string; name: string; image: string; category: string; detailsId: string }[];
}

export interface CurrencyExchangeOverviewLine {
  id: string;
  primaryValue: number;
  volumePrimaryValue: number;
  maxVolumeCurrency: string;
  maxVolumeRate: number;
  sparkline: { totalChange: number; data: number[] };
}

export interface CurrencyExchangeOverviewItem {
  id: string;
  name: string;
  image: string;
  category: string;
  detailsId: string;
}

export interface CurrencyExchangeOverviewResponse {
  core: CurrencyExchangeCore;
  lines: CurrencyExchangeOverviewLine[];
  items: CurrencyExchangeOverviewItem[];
}

export interface CurrencyExchangePairHistoryPoint {
  timestamp: string;
  rate: number;
  volumePrimaryValue: number;
}

export interface CurrencyExchangePair {
  id: string;
  rate: number;
  volumePrimaryValue: number;
  history: CurrencyExchangePairHistoryPoint[];
}

export interface CurrencyExchangeDetailsResponse {
  item: CurrencyExchangeOverviewItem;
  pairs: CurrencyExchangePair[];
}

// A candidate item collected from an overview pass, ready to have its details fetched.
export interface FlipCandidate {
  id: string;
  // The details endpoint requires this specific slug, which is NOT always the
  // same as `id` - e.g. Mirror of Kalandra's overview `id` is "mirror" but
  // its `detailsId` is "mirror-of-kalandra"; querying /details with "mirror"
  // 404s. Confirmed directly against the live API.
  detailsId: string;
  name: string;
  image: string;
  category: string;
  type: Poe2ExchangeType;
  overviewVolume: number;
}
