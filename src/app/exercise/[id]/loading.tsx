export default function ExerciseLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-10">
        <header className="flex items-center gap-3 px-4 py-1 border-b border-[var(--t-border)]">
          <div className="h-11 w-20 bg-[var(--t-hover)] rounded-xl animate-pulse" />
        </header>
      </div>

      <main className="flex-1 px-4 py-5 pb-28 space-y-5">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          <div className="h-6 w-40 bg-[var(--t-hover)] rounded animate-pulse" />
        </div>

        {/* Muscle map */}
        <div className="h-48 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />
          <div className="h-24 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />
        </div>

        {/* Chart */}
        <div className="h-44 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />

        {/* History */}
        <div className="h-40 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />
      </main>
    </div>
  );
}
