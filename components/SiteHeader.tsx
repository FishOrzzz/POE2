import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/60">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
          <span className="text-lg">⚒️</span>
          POE2 Toolbox
        </Link>
      </div>
    </header>
  );
}
