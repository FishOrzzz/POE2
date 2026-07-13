@AGENTS.md

# POE2 Currency Flip Finder

A Next.js dashboard that finds profitable "flips" in Path of Exile 2's Currency Exchange: items that can be bought priced in one currency (e.g. Exalted Orbs) and sold priced in another (e.g. Divine Orbs) for a profit, because those are separate markets that drift apart. Live at **https://poe-2.vercel.app**, repo is `FishOrzzz/POE2` on GitHub, auto-deploys on push to `main` via Vercel (free Hobby tier, no env vars/secrets needed).

## Data source: poe.ninja (not the official GGG API)

Two endpoints, both under `https://poe.ninja/poe2/api/economy`:

- **`/exchange/current/overview?league={league}&type={type}`** — documented/supported. Lists every item in a category with one normalized price. Used to get the candidate item list and the benchmark cross-rates (`core.rates`, e.g. how many Exalted/Chaos per 1 Divine). `type` values: `Currency`, `Ritual` (= Omens), `Runes`, `Essences`, `SoulCores`, `Idols`, `Fragments`, `Expedition`, `Delirium`, `Breach`, `Verisium`, `Abyss`, `UncutGems`, `LineageSupportGems` — see `POE2_EXCHANGE_TYPES` in `lib/poeNinjaTypes.ts`.
- **`/exchange/current/details?league={league}&type={type}&id={itemId}`** — **not** in poe.ninja's official API reference, found via browser devtools network inspection. This is the important one: it returns a `pairs` array with an **independently observed rate per currency** for that item (e.g. Omen of Light priced separately in Divine, Exalted, and Chaos terms) — that divergence between pairs *is* the arbitrage signal. The overview endpoint alone can't detect this; it only gives one normalized price per item.
- **Item icons are served from `web.poecdn.com`, not poe.ninja** (`lib/currencyDisplay.ts` → `getItemIconUrl`). Using the wrong host was a real bug we hit and fixed — the API returns a relative path like `/gen/image/...png` that must be prefixed with `web.poecdn.com`.
- **Rate limiting is aggressive**: expect `429 Too Many Requests` with a `Retry-After` header (seen up to ~280s) if you hammer it during dev testing — restarting the dev server triggers a fresh, uncached fetch and can retrigger this. Production is fine since Vercel's ISR only re-fetches once an hour and from different IPs than local dev.
- **No "last synced from GGG" timestamp exists anywhere** — checked both API responses and poe.ninja's own site. Their docs only say PoE2 data refreshes "roughly hourly" with a ~5min HTTP cache on top. The freshness banner (`components/FreshnessBanner.tsx`) approximates data age as minutes-since-the-top-of-the-current-UTC-hour, since that's the best available inference, not an exact fetch timestamp.
- **The details endpoint is undocumented and admittedly unstable** by poe.ninja's own admission ("we know these endpoints are used externally... treat that as best effort rather than a promise") — `lib/poeNinja.ts` skips (not crashes on) any item whose details fetch fails or has an unexpected shape.

### Why not the official GGG Currency Exchange API

Explored first and rejected. It returns proper per-pair `market_id`/ratio/stock data (would be *better* than poe.ninja), but registration isn't self-service — you must email `oauth@grindinggear.com` requesting a `client_credentials` confidential client with the `service:cxapi` scope, with no published turnaround time or guarantee of approval. Not worth blocking a hobby project on. Revisit only if poe.ninja's data source ever becomes insufficient or disappears.

## Architecture

- **`lib/poeNinja.ts`** — fetch layer. `fetchFlipDataset()` is the entry point: gets the current league, fetches all category overviews in parallel, narrows to the top 50 items by trade volume (`MAX_DETAILS_CANDIDATES`), then fetches `details` for each (concurrency-capped at 3 with a stagger, per poe.ninja's "be reasonable" guidance).
- **`lib/arbitrage.ts`** — pure computation, no framework dependency, safe to run on the server *or* in the browser:
  - `buildPool(dataset)` → raw per-item currency pairs (`PoolItem[]`), shipped to the client as-is.
  - `evaluateItem(item, rates, override?)` → the actual buy-cheapest/sell-priciest math for one item; `override` lets manually-entered prices take precedence over the raw API rate for a currency.
  - `computeFlips(pool, rates)` → runs `evaluateItem` over the whole pool, applies the liquidity floor (`MIN_LIQUIDITY = 20` divine-equivalent volume on both legs), returns everything that qualifies (`FlipResult.all`) plus the top-5-by-volume reference list. Deliberately does **not** slice to a top-20 here.
  - `rankTopFlips(all, metric)` → sorts `FlipResult.all` by `"divine"` (raw Divine profit) or `"percent"` (profit %) and slices to the top 20. Separated from `computeFlips` so the rank-metric toggle just re-sorts already-computed data instead of re-running rate conversion.
- **`app/page.tsx`** — server component, `revalidate = 3600` (ISR, matches poe.ninja's own hourly cadence). Fetches the dataset, builds the pool, and hands it to `FlipCalculator` as plain serializable props. No secrets/env vars involved anywhere in this app.
- **`components/FlipCalculator.tsx`** — the client-side state owner: ratio override, per-item overrides, expanded rows, and the rank metric. Recomputes via `computeFlips`/`rankTopFlips` client-side on change so the initial server-rendered output and subsequent client recomputation always agree (no hydration mismatch).
- **`components/FlipTable.tsx`, `RatioOverridePanel.tsx`, `RankMetricToggle.tsx`, `VolumeReference.tsx`, `FreshnessBanner.tsx`** — presentational pieces, mostly `"use client"` since they're interactive.

## Key design decisions (the "why")

- **Global ratio override re-ranks the whole pool; per-item price override only updates that row in place.** Confirmed with the user explicitly: editing one item's price shouldn't make it jump around or vanish from the list while you're mid-edit, but changing the global Chaos/Exalted-per-Divine ratio is foundational enough that it should recompute and re-rank everything, since a different ratio can change which items are even worth flipping.
- **Liquidity floor lives in `computeFlips`, not in `evaluateItem`.** A manually-overridden single item always shows its real computed number, even if its volume wouldn't normally clear the pool-eligibility bar — the floor only gates which items enter the ranked list, not whether a user-inspected item gets an honest answer.
- **`volume` is poe.ninja's traded-volume figure (labeled "Volume/Hour" on their own site), not live order-book stock.** The official GGG API would expose real stock ranges; poe.ninja doesn't, so this is a liquidity *signal*, not a guaranteed available quantity — labeled as such in the UI.
- **Top-50-by-volume pool, top-20 displayed.** Keeps the page focused (a leaderboard, not a full market browser) and keeps the per-hour details-request burst against poe.ninja reasonable.

## Local dev gotchas (Windows)

- Node.js was not preinstalled; install via `winget install --id OpenJS.NodeJS.LTS`.
- `.claude/launch.json` must point `runtimeExecutable` directly at `node.exe` running `node_modules/next/dist/bin/next` (with arg `dev`) — pointing it at `npm.cmd` fails because the spawned process doesn't inherit a PATH containing Node, so `npm.cmd`'s internal `node` invocation errors with `'"node"' is not recognized`.
- Don't restart the local dev server repeatedly while testing — each restart forces a fresh, uncached poe.ninja fetch and can trip their rate limit for several minutes. Prefer just reloading the page (Fast Refresh/HMR handles most code changes without a restart).
