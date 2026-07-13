import { TrendDirection } from "@/lib/economy";

const STYLES: Record<TrendDirection, { label: string; icon: string; className: string }> = {
  rising: {
    label: "Rising",
    icon: "📈",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  falling: {
    label: "Falling",
    icon: "📉",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  volatile: {
    label: "Volatile",
    icon: "⚡",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  flat: {
    label: "Flat",
    icon: "➖",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

export default function TrendTag({ direction }: { direction: TrendDirection }) {
  const style = STYLES[direction];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}
    >
      {style.icon} {style.label}
    </span>
  );
}
