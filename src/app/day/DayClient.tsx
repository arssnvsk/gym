'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import MuscleMap from '@/components/MuscleMap';
import { getDayStats, getDayStatsCached, type DayStats, type DayTrend, type ExerciseTrend } from '@/lib/day';

function getTodayDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

function formatHeaderDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return `Сегодня, ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
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
  icon: string;
  label: string;
  bg: string;
  border: string;
  textColor: string;
}> = {
  progress: {
    icon: '↑',
    label: 'Прогресс',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    textColor: 'text-green-400',
  },
  regression: {
    icon: '↓',
    label: 'Регресс',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    textColor: 'text-red-400',
  },
  neutral: {
    icon: '→',
    label: 'Без изменений',
    bg: 'bg-[#1A1A1A]',
    border: 'border-[#2A2A2A]',
    textColor: 'text-[#888]',
  },
  first: {
    icon: '★',
    label: 'Первая тренировка',
    bg: 'bg-[#FF5722]/10',
    border: 'border-[#FF5722]/20',
    textColor: 'text-[#FF5722]',
  },
};

const EXERCISE_TREND_COLORS: Record<Exclude<ExerciseTrend, 'new'>, string> = {
  progress: 'text-green-400',
  regression: 'text-red-400',
  neutral: 'text-[#555]',
};

const EXERCISE_TREND_ICONS: Record<Exclude<ExerciseTrend, 'new'>, string> = {
  progress: '↑',
  regression: '↓',
  neutral: '→',
};

function TrendBadge({ trend, changePercent }: { trend: ExerciseTrend; changePercent: number | null }) {
  if (trend === 'new') {
    return (
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30 whitespace-nowrap">
        Впервые
      </span>
    );
  }

  const color = EXERCISE_TREND_COLORS[trend];
  const icon = EXERCISE_TREND_ICONS[trend];
  const sign = changePercent !== null && changePercent > 0 ? '+' : '';
  const pct = changePercent !== null ? `\u00a0${sign}${changePercent}%` : '';

  return (
    <span className={`text-sm font-semibold tabular-nums ${color}`}>
      {icon}{pct}
    </span>
  );
}

export default function DayClient() {
  const router = useRouter();
  const t = useTranslations();
  const [stats, setStats] = useState<DayStats | null>(null);
  const [loading, setLoading] = useState(true);
  const today = getTodayDate();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
        return;
      }

      // Show IndexedDB data immediately — no network needed
      getDayStatsCached(today).then(cached => {
        if (cached) {
          setStats(cached);
          setLoading(false);
        }
      });

      // Refresh from Supabase silently in background
      getDayStats(today)
        .then(fresh => {
          setStats(fresh);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router, today]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader date={today} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#444] text-sm">Загрузка...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader date={today} />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <span className="text-5xl">🏃</span>
          <p className="text-[#888] text-sm text-center">Сегодня ещё не тренировался</p>
          <Link
            href="/"
            className="px-6 py-3 bg-[#FF5722] text-white font-semibold rounded-xl text-sm active:scale-95 transition-all"
          >
            Добавить подход
          </Link>
        </div>
      </div>
    );
  }

  const cfg = DAY_TREND_CONFIG[stats.dayTrend];

  const summaryParts: string[] = [];
  if (stats.progressCount > 0) summaryParts.push(`${stats.progressCount}\u00a0в\u00a0прогрессе`);
  if (stats.regressionCount > 0) summaryParts.push(`${stats.regressionCount}\u00a0в\u00a0регрессе`);
  if (stats.newCount > 0) summaryParts.push(`${stats.newCount}\u00a0новых`);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader date={today} />

      <main className="flex-1 px-4 py-5 space-y-4 pb-10">
        {/* Overall assessment */}
        <div className={`rounded-2xl border p-4 ${cfg.bg} ${cfg.border}`}>
          <div className="flex items-center gap-4">
            <span className={`text-4xl font-bold leading-none ${cfg.textColor}`}>{cfg.icon}</span>
            <div>
              <div className={`text-lg font-bold leading-tight ${cfg.textColor}`}>{cfg.label}</div>
              {summaryParts.length > 0 && (
                <div className="text-xs text-[#666] mt-1">{summaryParts.join(' · ')}</div>
              )}
            </div>
          </div>
        </div>

        {/* Muscle map */}
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-4">
          <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-4">
            Сегодня работали
          </h2>
          <MuscleMap primary={stats.primaryMuscles} secondary={stats.secondaryMuscles} />
        </div>

        {/* Exercise breakdown */}
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <h2 className="text-xs font-semibold text-[#555] uppercase tracking-wider">
              Разбивка по упражнениям
            </h2>
          </div>
          <div className="divide-y divide-[#1A1A1A]">
            {stats.exerciseStats.map((stat) => (
              <div key={stat.exercise.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none shrink-0">{stat.exercise.icon}</span>
                    <span className="text-sm font-medium text-white truncate">
                      {t(stat.exercise.nameKey)}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#555] mt-0.5 ml-7">
                    {stat.todaySets}&nbsp;{pluralSets(stat.todaySets)}
                    {stat.prevDate && ` · был ${formatShortDate(stat.prevDate)}`}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {formatVolume(stat.todayVolume, stat.isBodyweight)}
                  </span>
                  <TrendBadge trend={stat.trend} changePercent={stat.changePercent} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function PageHeader({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-3 sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#1A1A1A]">
      <Link
        href="/"
        className="text-[#888] hover:text-white transition-colors text-2xl leading-none"
      >
        ←
      </Link>
      <span className="text-white font-semibold">{formatHeaderDate(date)}</span>
    </div>
  );
}
