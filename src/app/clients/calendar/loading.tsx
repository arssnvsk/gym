export default function CalendarLoading() {
  return (
    <div style={{ height: '100dvh' }} className="flex flex-col bg-[var(--t-bg)]">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--t-hover)] px-4 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-16 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          <div className="flex-1 h-5 bg-[var(--t-hover)] rounded animate-pulse mx-4" />
          <div className="h-8 w-20 bg-[var(--t-hover)] rounded-xl animate-pulse" />
        </div>
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          <div className="h-5 w-32 bg-[var(--t-hover)] rounded animate-pulse" />
          <div className="w-8 h-8 bg-[var(--t-hover)] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* DOW header */}
      <div className="grid grid-cols-7 border-b border-[var(--t-hover)] shrink-0">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="py-2 flex justify-center">
            <div className="h-3 w-5 bg-[var(--t-hover)] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Month grid skeleton */}
      <div className="flex-1 grid grid-cols-7">
        {[...Array(35)].map((_, i) => (
          <div key={i} className="border-b border-r border-[var(--t-hover)] min-h-[76px] p-1 space-y-1">
            <div className="h-5 w-5 bg-[var(--t-hover)] rounded-full animate-pulse mx-auto" />
            {i % 3 === 0 && <div className="h-3 bg-[var(--t-hover)] rounded animate-pulse" />}
            {i % 5 === 0 && <div className="h-3 bg-[var(--t-hover)] rounded animate-pulse" />}
          </div>
        ))}
      </div>
    </div>
  );
}
