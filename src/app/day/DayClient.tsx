'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import MuscleMap from '@/components/MuscleMap';
import {
  getDayStats,
  getDayStatsCached,
  getWorkoutDatesCached,
  type DayStats,
  type DayTrend,
  type ExerciseTrend,
} from '@/lib/day';

function getTodayDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function formatHeaderDate(dateStr: string, todayStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];

  if (dateStr === todayStr) return `Сегодня, ${day} ${month}`;

  const yesterday = new Date(todayStr + 'T12:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return `Вчера, ${day} ${month}`;

  return `${WEEKDAYS_SHORT[date.getDay()]}, ${day} ${month}`;
}

function formatChipDate(dateStr: string, todayStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];

  if (dateStr === todayStr) return 'Сегодня';

  const yesterday = new Date(todayStr + 'T12:00:00');
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === yesterday.toISOString().slice(0, 10)) return 'Вчера';

  return `${day} ${month}`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

function formatVolume(volume: number, isBodyweight: boolean): string {
  if (isBodyweight) return `${volume}\u00a0раз`;
  if (volume >= 1000) {
    const thousands = Math.floor(volume / 1000);
    const remainder = String(Math.round(volume % 1000)).padStart(3, '0');
    return `${thousands}\u00a0${remainder}\u00a0кг`;
  }
  return `${Math.round(volume)}\u00a0кг`;
}

function pluralSets(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'подход';
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'подхода';
  return 'подходов';
}

const DAY_TREND_CONFIG: Record<DayTrend, {
  icon: string; label: string; bg: string; border: string; textColor: string;
}> = {
  progress:   { icon: '↑', label: 'Прогресс',           bg: 'bg-green-500/10',    border: 'border-green-500/20',    textColor: 'text-green-400' },
  regression: { icon: '↓', label: 'Регресс',             bg: 'bg-red-500/10',      border: 'border-red-500/20',      textColor: 'text-red-400' },
  neutral:    { icon: '→', label: 'Без изменений',        bg: 'bg-[var(--t-hover)]',       border: 'border-[var(--t-border2)]',       textColor: 'text-[var(--t-muted)]' },
  first:      { icon: '★', label: 'Первая тренировка',   bg: 'bg-[#FF5722]/10',    border: 'border-[#FF5722]/20',    textColor: 'text-[#FF5722]' },
};

const EXERCISE_TREND_COLORS: Record<Exclude<ExerciseTrend, 'new'>, string> = {
  progress: 'text-green-400', regression: 'text-red-400', neutral: 'text-[var(--t-faint)]',
};
const EXERCISE_TREND_ICONS: Record<Exclude<ExerciseTrend, 'new'>, string> = {
  progress: '↑', regression: '↓', neutral: '→',
};

function TrendBadge({ trend, changePercent }: { trend: ExerciseTrend; changePercent: number | null }) {
  if (trend === 'new') {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30 whitespace-nowrap">
        Впервые
      </span>
    );
  }
  const sign = changePercent !== null && changePercent > 0 ? '+' : '';
  const pct = changePercent !== null ? `\u00a0${sign}${changePercent}%` : '';
  return (
    <span className={`text-sm font-semibold tabular-nums ${EXERCISE_TREND_COLORS[trend]}`}>
      {EXERCISE_TREND_ICONS[trend]}{pct}
    </span>
  );
}

export default function DayClient() {
  const router = useRouter();
  const t = useTranslations();
  const today = getTodayDate();

  const [selectedDate, setSelectedDate] = useState(today);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Load available dates from IndexedDB on mount
  useEffect(() => {
    getWorkoutDatesCached().then(dates => {
      setAvailableDates(dates);
      // If today has no data but there are past dates, stay on today (empty state will show)
    });
  }, []);

  // Auth check — runs once
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
    });
  }, [router]);

  // Load stats whenever selectedDate changes
  useEffect(() => {
    setLoading(true);
    setStats(null);

    // Show IndexedDB data immediately
    getDayStatsCached(selectedDate).then(cached => {
      if (cached) {
        setStats(cached);
        setLoading(false);
      }
    });

    // Refresh from Supabase silently
    getDayStats(selectedDate)
      .then(fresh => {
        setStats(fresh);
        setLoading(false);
        // After Supabase fetch, refresh available dates (new dates might have appeared)
        getWorkoutDatesCached().then(setAvailableDates);
      })
      .catch(() => setLoading(false));
  }, [selectedDate]);

  // Scroll selected chip into view
  useEffect(() => {
    chipRefs.current[selectedDate]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [selectedDate, availableDates]);

  const cfg = stats ? DAY_TREND_CONFIG[stats.dayTrend] : null;
  const summaryParts: string[] = [];
  if (stats) {
    if (stats.progressCount > 0) summaryParts.push(`${stats.progressCount}\u00a0в\u00a0прогрессе`);
    if (stats.regressionCount > 0) summaryParts.push(`${stats.regressionCount}\u00a0в\u00a0регрессе`);
    if (stats.newCount > 0) summaryParts.push(`${stats.newCount}\u00a0новых`);
  }

  const isToday = selectedDate === today;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--t-bg)] z-10 border-b border-[var(--t-hover)]">
        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <Link
            href="/"
            className="flex items-center gap-1 h-11 pl-1 pr-3 -ml-1 rounded-xl text-[var(--t-muted)] hover:text-[var(--t-text)] active:bg-[var(--t-overlay)] transition-colors text-sm font-medium shrink-0"
          >
            <span className="text-lg leading-none">‹</span>
            <span>Назад</span>
          </Link>
          <span className="text-[var(--t-text)] font-semibold truncate">
            {formatHeaderDate(selectedDate, today)}
          </span>
        </div>

        {/* Date chips */}
        {availableDates.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
            {availableDates.map(date => (
              <button
                key={date}
                ref={el => { chipRefs.current[date] = el; }}
                onClick={() => setSelectedDate(date)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                  date === selectedDate
                    ? 'bg-[#FF5722] text-white'
                    : 'bg-[var(--t-card)] border border-[var(--t-border)] text-[var(--t-sub)] hover:text-[var(--t-text)] hover:border-[var(--t-border3)]'
                }`}
              >
                {formatChipDate(date, today)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[var(--t-icon)] text-sm">Загрузка...</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !stats && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <span className="text-5xl">🏃</span>
          <p className="text-[var(--t-muted)] text-sm text-center">
            {isToday ? 'Сегодня ещё не тренировался' : 'В этот день не было тренировки'}
          </p>
          {isToday && (
            <Link
              href="/"
              className="px-6 py-3 bg-[#FF5722] text-white font-semibold rounded-xl text-sm active:scale-95 transition-all"
            >
              Добавить подход
            </Link>
          )}
        </div>
      )}

      {/* Content */}
      {!loading && stats && cfg && (
        <main className="flex-1 px-4 py-5 space-y-4 pb-10">
          {/* Overall assessment */}
          <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-center gap-4">
              <span className={`text-4xl font-bold leading-none ${cfg.textColor}`}>{cfg.icon}</span>
              <div>
                <div className={`text-lg font-bold leading-tight ${cfg.textColor}`}>{cfg.label}</div>
                {summaryParts.length > 0 && (
                  <div className="text-xs text-[var(--t-sub)] mt-1">{summaryParts.join(' · ')}</div>
                )}
              </div>
            </div>
          </div>

          {/* Muscle map */}
          <div className="bg-[var(--t-surface)] border border-[var(--t-hover)] rounded-2xl p-4">
            <h2 className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-4">
              Активные мышцы
            </h2>
            <MuscleMap primary={stats.primaryMuscles} secondary={stats.secondaryMuscles} />
          </div>

          {/* Exercise breakdown */}
          <div className="bg-[var(--t-surface)] border border-[var(--t-hover)] rounded-2xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <h2 className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider">
                Разбивка по упражнениям
              </h2>
            </div>
            <div className="divide-y divide-[var(--t-hover)]">
              {stats.exerciseStats.map((stat) => (
                <div key={stat.exercise.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none shrink-0">{stat.exercise.icon}</span>
                      <span className="text-sm font-medium text-[var(--t-text)] truncate">
                        {t(stat.exercise.nameKey)}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--t-faint)] mt-0.5 ml-7">
                      {stat.todaySets}&nbsp;{pluralSets(stat.todaySets)}
                      {stat.prevDate && ` · был ${formatShortDate(stat.prevDate)}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-sm font-semibold text-[var(--t-text)] tabular-nums">
                      {formatVolume(stat.todayVolume, stat.isBodyweight)}
                    </span>
                    <TrendBadge trend={stat.trend} changePercent={stat.changePercent} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
