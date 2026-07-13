import {
  BENCHMARK_CURRENCY_IDS,
  CurrencyExchangeCore,
  CurrencyExchangeDetailsResponse,
  CurrencyExchangeOverviewResponse,
  EconomyLeague,
  FlipCandidate,
  POE2_EXCHANGE_TYPES,
  Poe2ExchangeType,
} from "./poeNinjaTypes";

const BASE_URL = "https://poe.ninja/poe2/api/economy";
const USER_AGENT = "POE2-Flip-Finder/1.0 (contact: github.com/FishOrzzz/POE2)";

// Only look at items with meaningful trade volume in the overview pass before
// spending a details request on them. Matches the arbitrage layer's own
// liquidity floor - an item that won't clear that floor isn't worth a request.
const MIN_OVERVIEW_VOLUME = 20;

// Hard cap on how many items get a details request per run, regardless of how
// many clear the volume floor. We only need the top 20 flips, so there's no
// value in checking hundreds of items - this bounds the request burst poe.ninja
// sees per hourly refresh.
const MAX_DETAILS_CANDIDATES = 80;

// Cap how many details requests run at once, per poe.ninja's "be reasonable
// with concurrency" guidance, plus a small stagger between dispatches so the
// burst is spread out rather than firing near-simultaneously.
const DETAILS_CONCURRENCY = 3;
const DETAILS_STAGGER_MS = 120;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function poeNinjaFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`poe.ninja request failed: ${res.status} ${url.toString()}`);
  }

  return res.json() as Promise<T>;
}

export async function getCurrentLeague(): Promise<string> {
  const leagues = await poeNinjaFetch<EconomyLeague[]>("/leagues", {});
  if (!leagues.length) {
    throw new Error("poe.ninja returned no economy leagues");
  }
  return leagues[0].id;
}

export async function getCategoryOverview(
  league: string,
  type: Poe2ExchangeType,
): Promise<CurrencyExchangeOverviewResponse> {
  return poeNinjaFetch<CurrencyExchangeOverviewResponse>("/exchange/current/overview", {
    league,
    type,
  });
}

export async function getItemDetails(
  league: string,
  type: Poe2ExchangeType,
  id: string,
): Promise<CurrencyExchangeDetailsResponse | null> {
  try {
    return await poeNinjaFetch<CurrencyExchangeDetailsResponse>("/exchange/current/details", {
      league,
      type,
      id,
    });
  } catch {
    // The details endpoint is undocumented/unstable by poe.ninja's own admission -
    // skip items it doesn't like rather than failing the whole run.
    return null;
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    const currentIndex = nextIndex++;
    if (currentIndex >= items.length) return;
    if (currentIndex > 0) await sleep(DETAILS_STAGGER_MS);
    results[currentIndex] = await worker(items[currentIndex]);
    await runNext();
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

export interface FlipDataset {
  league: string;
  core: CurrencyExchangeCore;
  details: { candidate: FlipCandidate; details: CurrencyExchangeDetailsResponse }[];
}

// Fetches every relevant PoE2 exchange category, narrows to items worth checking,
// then pulls per-item currency-pair data for each. This is the single entry point
// the arbitrage layer and the page's ISR fetch should call.
export async function fetchFlipDataset(): Promise<FlipDataset> {
  const league = await getCurrentLeague();

  const overviews = await Promise.all(
    POE2_EXCHANGE_TYPES.map(async (type) => ({
      type,
      overview: await getCategoryOverview(league, type),
    })),
  );

  // core.rates/items are the same global benchmark regardless of category -
  // the Currency overview is guaranteed to include divine/exalted/chaos.
  const currencyOverview = overviews.find((o) => o.type === "Currency")?.overview;
  if (!currencyOverview) {
    throw new Error("poe.ninja Currency overview missing - can't establish benchmark rates");
  }
  const core = currencyOverview.core;

  const candidates: FlipCandidate[] = [];
  for (const { type, overview } of overviews) {
    const itemsById = new Map(overview.items.map((item) => [item.id, item]));
    for (const line of overview.lines) {
      if (BENCHMARK_CURRENCY_IDS.includes(line.id as (typeof BENCHMARK_CURRENCY_IDS)[number])) {
        continue; // don't flip the reference currencies against themselves
      }
      if (line.volumePrimaryValue < MIN_OVERVIEW_VOLUME) {
        continue;
      }
      const item = itemsById.get(line.id);
      if (!item) continue;
      candidates.push({
        id: line.id,
        name: item.name,
        image: item.image,
        category: item.category,
        type,
        overviewVolume: line.volumePrimaryValue,
      });
    }
  }

  const topCandidates = candidates
    .sort((a, b) => b.overviewVolume - a.overviewVolume)
    .slice(0, MAX_DETAILS_CANDIDATES);

  const detailsResults = await runWithConcurrency(topCandidates, DETAILS_CONCURRENCY, async (candidate) => {
    const details = await getItemDetails(league, candidate.type, candidate.id);
    return { candidate, details };
  });

  const details = detailsResults.filter(
    (r): r is { candidate: FlipCandidate; details: CurrencyExchangeDetailsResponse } => r.details !== null,
  );

  return { league, core, details };
}
