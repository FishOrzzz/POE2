import ToolCard from "@/components/ToolCard";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-2 text-center sm:text-left">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          POE2 Toolbox
        </h1>
        <p className="max-w-xl text-sm text-zinc-500 dark:text-zinc-400 sm:text-base">
          A growing set of tools for Path of Exile 2 trading and economy analysis. Pick a tool
          below to get started.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ToolCard
          href="/currency-flip"
          icon="💱"
          title="Currency Flip Finder"
          description="Finds the most profitable Currency Exchange flips right now, ranked by Divine profit or profit %, with a manual calculator to verify against live prices."
          status="live"
        />
        <ToolCard
          icon="📈"
          title="Economy Analyzer"
          description="Tracks how the league economy evolves over a season — currency value curves, item price trends, and how they compare across leagues."
          status="coming-soon"
        />
      </div>

      <footer className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
        Data via{" "}
        <a href="https://poe.ninja" className="underline" target="_blank" rel="noopener noreferrer">
          poe.ninja
        </a>
        . Not affiliated with Grinding Gear Games.
      </footer>
    </div>
  );
}
