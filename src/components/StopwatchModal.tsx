'use client';

import { useTranslations } from 'next-intl';

interface StopwatchModalProps {
  elapsed: number;
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onClose: () => void;
}

function formatTime(ms: number) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const t = Math.floor((ms % 1000) / 100);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${t}`;
}

export default function StopwatchModal({
  elapsed,
  running,
  onStart,
  onPause,
  onReset,
  onClose,
}: StopwatchModalProps) {
  const t = useTranslations();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md bg-[var(--t-card)] border border-[var(--t-border)] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-[var(--t-text)]">{t('stopwatch.title')}</h2>
          <button
            onClick={onClose}
            className="text-[var(--t-faint)] hover:text-[var(--t-text)] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--t-border)] transition-colors text-xl"
          >
            ×
          </button>
        </div>

        {/* Display */}
        <div className="flex items-center justify-center mb-10">
          <span
            className="font-mono font-bold tabular-nums tracking-tight"
            style={{ fontSize: '4rem', lineHeight: 1, color: running ? '#FF5722' : 'var(--t-text)' }}
          >
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={onReset}
            disabled={elapsed === 0}
            className="flex-1 py-3.5 rounded-2xl border border-[var(--t-border)] text-[var(--t-muted)] font-semibold hover:bg-[var(--t-border)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('stopwatch.reset')}
          </button>
          <button
            onClick={running ? onPause : onStart}
            className={`flex-1 py-3.5 rounded-2xl font-semibold transition-all active:scale-95 ${
              running
                ? 'bg-[var(--t-border)] text-[var(--t-text)] hover:bg-[var(--t-border2)]'
                : 'bg-[#FF5722] text-white hover:bg-[#FF6D3A] shadow-lg shadow-[#FF5722]/30'
            }`}
          >
            {running ? t('stopwatch.pause') : elapsed > 0 ? t('stopwatch.resume') : t('stopwatch.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
