import Link from "next/link";

interface ToolCardProps {
  href?: string;
  icon: string;
  title: string;
  description: string;
  status: "live" | "coming-soon";
}

export default function ToolCard({ href, icon, title, description, status }: ToolCardProps) {
  const isLive = status === "live";

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-3xl">{icon}</span>
        {isLive ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Coming soon
          </span>
        )}
      </div>

      <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>

      {isLive && (
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400">
          Open tool <span aria-hidden>&rarr;</span>
        </span>
      )}
    </>
  );

  const baseClass =
    "flex flex-col rounded-2xl border p-6 transition-all";

  if (isLive && href) {
    return (
      <Link
        href={href}
        className={`${baseClass} border-zinc-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-700`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={`${baseClass} cursor-not-allowed border-dashed border-zinc-200 bg-zinc-50 opacity-70 dark:border-zinc-800 dark:bg-zinc-900/40`}
    >
      {content}
    </div>
  );
}
