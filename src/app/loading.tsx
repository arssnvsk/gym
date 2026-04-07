export default function HomeLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-10">
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--t-border)]">
          <div className="w-9 h-9 rounded-xl bg-[var(--t-hover)] animate-pulse" />
          <div className="h-5 w-24 bg-[var(--t-hover)] rounded animate-pulse" />
          <div className="w-8 h-8 rounded-full bg-[var(--t-hover)] animate-pulse" />
        </header>
      </div>

      <main className="flex-1 px-4 pb-28 pt-4">
        {/* Search */}
        <div className="h-11 bg-[var(--t-card)] border border-[var(--t-border)] rounded-xl animate-pulse mb-5" />

        {/* Category rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="mb-2">
            <div className="h-9 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          </div>
        ))}
      </main>
    </div>
  );
}
