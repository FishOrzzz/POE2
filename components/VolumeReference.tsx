import { FlipOpportunity } from "@/lib/arbitrage";
import { formatRate } from "@/lib/currencyDisplay";

// Gives the volume numbers on each flip row a sense of scale - without this,
// "~29 div volume" has no reference point for whether that's liquid or not.
export default function VolumeReference({ items }: { items: FlipOpportunity[] }) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        For scale — highest volume/hr right now
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {items.map((item) => (
          <li key={item.id} className="whitespace-nowrap">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.name}</span>{" "}
            &mdash; ~{formatRate(item.volume)} div/hr
          </li>
        ))}
      </ul>
    </div>
  );
}
