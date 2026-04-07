export default function DayLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 bg-[var(--t-bg)] z-10 border-b border-[var(--t-hover)]">
        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <div className="h-11 w-20 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-[var(--t-hover)] rounded animate-pulse" />
        </div>
      </div>

      <main className="flex-1 px-4 py-5 space-y-4 pb-10">
        {/* Trend card */}
        <div className="h-20 bg-[var(--t-hover)] rounded-2xl animate-pulse" />

        {/* Muscle map */}
        <div className="h-52 bg-[var(--t-surface)] border border-[var(--t-hover)] rounded-2xl animate-pulse" />

        {/* Exercise breakdown */}
        <div className="bg-[var(--t-surface)] border border-[var(--t-hover)] rounded-2xl overflow-hidden">
          <div className="h-11 border-b border-[var(--t-hover)] animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 border-b border-[var(--t-hover)] animate-pulse" />
          ))}
        </div>
      </main>
    </div>
  );
}
