export default function ClientsLoading() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--t-bg)]">
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-[var(--t-border)]">
        <div className="w-9 h-9 rounded-xl bg-[var(--t-hover)] animate-pulse" />
        <div className="h-5 w-20 bg-[var(--t-hover)] rounded animate-pulse" />
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Add input row */}
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-[var(--t-card)] border border-[var(--t-border)] rounded-xl animate-pulse" />
          <div className="w-28 h-10 bg-[var(--t-hover)] rounded-xl animate-pulse" />
        </div>

        {/* Client cards */}
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
