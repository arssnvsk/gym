export default function SettingsLoading() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-10">
        <header className="flex items-center gap-2 px-4 py-1 border-b border-[var(--t-border)]">
          <div className="h-11 w-20 bg-[var(--t-hover)] rounded-xl animate-pulse" />
          <div className="h-4 w-24 bg-[var(--t-hover)] rounded animate-pulse" />
        </header>
      </div>

      <main className="flex-1 px-4 py-5 space-y-6">
        {/* Theme section */}
        <div>
          <div className="h-3 w-36 bg-[var(--t-hover)] rounded animate-pulse mb-3" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Layout section */}
        <div>
          <div className="h-3 w-48 bg-[var(--t-hover)] rounded animate-pulse mb-3" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
