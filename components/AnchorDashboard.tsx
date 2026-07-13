import TrendChart from "@/components/TrendChart";
import { AnchorPoint, NamedSeries } from "@/lib/economy";

interface AnchorDashboardProps {
  divineChaosRatio: AnchorPoint[];
  anchorSeries: NamedSeries[];
}

function normalizeToPercentChange(points: AnchorPoint[]): AnchorPoint[] {
  if (points.length === 0) return [];
  const base = points[0].value;
  if (!base) return [];
  return points.map((p) => ({ timestamp: p.timestamp, value: ((p.value - base) / base) * 100 }));
}

export default function AnchorDashboard({ divineChaosRatio, anchorSeries }: AnchorDashboardProps) {
  const mirror = anchorSeries.find((s) => s.id === "mirror");
  const hinekora = anchorSeries.find((s) => s.id === "hinekoras-lock");

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Chaos per Divine</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Derived from items priced in both currencies — poe.ninja doesn&apos;t expose Divine or Chaos&apos;s own
          price history directly.
        </p>
        <TrendChart
          series={[{ key: "ratio", label: "Chaos per Divine", color: "#0ea5e9", points: divineChaosRatio }]}
          format="rate"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Mirror of Kalandra vs Hinekora&apos;s Lock
        </h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Normalized to % change from the start of the season. Mirror is the single biggest driver of the
          economy, but also the most exposed to real-money-trading behavior — when Mirror swings while
          Hinekora&apos;s Lock stays steady, that divergence is more likely RMT noise than a genuine shift.
        </p>
        <TrendChart
          series={[
            ...(mirror
              ? [
                  {
                    key: "mirror",
                    label: "Mirror of Kalandra",
                    color: "#d946ef",
                    points: normalizeToPercentChange(mirror.points),
                  },
                ]
              : []),
            ...(hinekora
              ? [
                  {
                    key: "hinekora",
                    label: "Hinekora's Lock",
                    color: "#f59e0b",
                    points: normalizeToPercentChange(hinekora.points),
                  },
                ]
              : []),
          ]}
          format="percent"
        />
      </div>
    </div>
  );
}
