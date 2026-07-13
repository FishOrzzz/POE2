"use client";

import { useMemo, useState } from "react";
import FlipTable, { DisplayRow } from "@/components/FlipTable";
import RatioOverridePanel from "@/components/RatioOverridePanel";
import VolumeReference from "@/components/VolumeReference";
import { computeFlips, evaluateItem, ItemOverride, PoolItem, RateMap } from "@/lib/arbitrage";

interface Props {
  pool: PoolItem[];
  defaultRates: RateMap;
}

function parseRateInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export default function FlipCalculator({ pool, defaultRates }: Props) {
  const [ratioOverride, setRatioOverride] = useState<RateMap>({});
  const [itemOverrides, setItemOverrides] = useState<Record<string, ItemOverride>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const poolById = useMemo(() => new Map(pool.map((p) => [p.id, p])), [pool]);

  const effectiveRates = useMemo<RateMap>(
    () => ({ ...defaultRates, ...ratioOverride }),
    [defaultRates, ratioOverride],
  );

  // The only place a full re-rank happens - global ratio changes recompute
  // and re-rank the whole pool. Per-item overrides never touch this.
  const baseResult = useMemo(() => computeFlips(pool, effectiveRates), [pool, effectiveRates]);

  const rows: DisplayRow[] = useMemo(
    () =>
      baseResult.topFlips.map((flip) => {
        const override = itemOverrides[flip.id];
        const hasOverride = !!override && Object.keys(override).length > 0;

        if (!hasOverride) {
          return { flip, hasOverride: false, invalidOverride: false };
        }

        const poolItem = poolById.get(flip.id);
        const recomputed = poolItem ? evaluateItem(poolItem, effectiveRates, override) : null;

        if (!recomputed) {
          return { flip, hasOverride: true, invalidOverride: true };
        }

        return {
          flip: { ...recomputed, volumeRank: flip.volumeRank, volumePoolSize: flip.volumePoolSize },
          hasOverride: true,
          invalidOverride: false,
        };
      }),
    [baseResult.topFlips, itemOverrides, poolById, effectiveRates],
  );

  const hasAnyOverride =
    ratioOverride.chaos !== undefined ||
    ratioOverride.exalted !== undefined ||
    Object.keys(itemOverrides).length > 0;

  function handleRatioChange(field: "chaos" | "exalted", value: string) {
    setRatioOverride((prev) => {
      const next = { ...prev };
      const parsed = parseRateInput(value);
      if (parsed === undefined) delete next[field];
      else next[field] = parsed;
      return next;
    });
  }

  function handleClearRatios() {
    setRatioOverride({});
  }

  function handleClearAll() {
    setRatioOverride({});
    setItemOverrides({});
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleItemOverrideChange(id: string, currencyId: string, value: string) {
    setItemOverrides((prev) => {
      const current = { ...(prev[id] ?? {}) };
      const parsed = parseRateInput(value);
      if (parsed === undefined) delete current[currencyId];
      else current[currencyId] = parsed;

      const next = { ...prev };
      if (Object.keys(current).length === 0) delete next[id];
      else next[id] = current;
      return next;
    });
  }

  function handleClearItem(id: string) {
    setItemOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  return (
    <>
      <RatioOverridePanel
        ratioOverride={ratioOverride}
        defaultRates={defaultRates}
        hasAnyOverride={hasAnyOverride}
        onChange={handleRatioChange}
        onClearRatios={handleClearRatios}
        onClearAll={handleClearAll}
      />
      <VolumeReference items={baseResult.topByVolume} />
      <FlipTable
        rows={rows}
        poolById={poolById}
        itemOverrides={itemOverrides}
        expandedIds={expandedIds}
        onToggleExpand={toggleExpand}
        onItemOverrideChange={handleItemOverrideChange}
        onClearItem={handleClearItem}
      />
    </>
  );
}
