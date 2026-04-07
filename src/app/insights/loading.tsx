export default function InsightsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 bg-[var(--t-bg)] z-10 border-b border-[var(--t-hover)]">
        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <div className="h-11 w-20 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          <div className="h-4 w-16 bg-[var(--t-hover)] rounded animate-pulse" />
        </div>
      </div>

      <main className="flex-1 px-4 pt-4 pb-10 space-y-3">
        {/* Summary chips */}
        <div className="flex gap-2 flex-wrap mb-1">
          {[72, 96, 80, 64].map((w, i) => (
            <div key={i} className="h-7 bg-[var(--t-hover)] rounded-full animate-pulse" style={{ width: w }} />
          ))}
        </div>

        {/* Insight cards */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-36 bg-[var(--t-surface)] border border-[var(--t-hover)] border-l-4 border-l-[var(--t-border2)] rounded-2xl animate-pulse"
          />
        ))}
      </main>
    </div>
  );
}
