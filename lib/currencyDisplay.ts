// Small display helpers for the three benchmark currencies flips are always
// denominated in. Kept separate from the data layer since this is purely presentational.

interface CurrencyStyle {
  label: string;
  textClass: string;
  bgClass: string;
}

const CURRENCY_STYLES: Record<string, CurrencyStyle> = {
  divine: {
    label: "Divine Orb",
    textClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-100 dark:bg-sky-950",
  },
  exalted: {
    label: "Exalted Orb",
    textClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-950",
  },
  chaos: {
    label: "Chaos Orb",
    textClass: "text-fuchsia-600 dark:text-fuchsia-400",
    bgClass: "bg-fuchsia-100 dark:bg-fuchsia-950",
  },
};

const FALLBACK_STYLE: CurrencyStyle = {
  label: "Unknown",
  textClass: "text-zinc-600 dark:text-zinc-400",
  bgClass: "bg-zinc-100 dark:bg-zinc-800",
};

export function getCurrencyStyle(id: string): CurrencyStyle {
  return CURRENCY_STYLES[id] ?? FALLBACK_STYLE;
}

export function formatRate(rate: number): string {
  if (rate >= 1000) return rate.toFixed(0);
  if (rate >= 100) return rate.toFixed(1);
  if (rate >= 1) return rate.toFixed(2);
  return rate.toFixed(4);
}

// Interpolates a green -> amber hue for the profit-rank gradient, brightest
// green at rank 0 (best flip) cooling toward amber by the last rank.
export function getRankAccentColor(rankIndex: number, total: number): string {
  const t = total <= 1 ? 0 : rankIndex / (total - 1);
  const hue = 145 - t * 100; // 145 (green) -> 45 (amber)
  return `hsl(${hue}, 70%, 45%)`;
}
