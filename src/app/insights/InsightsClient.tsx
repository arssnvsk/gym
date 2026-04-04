'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import * as localDb from '@/lib/db';
import { computeInsights, type Insight, type InsightSeverity } from '@/lib/insights';
import type { WorkoutSet } from '@/types';

// ── severity config ─────────────────────────────────────────────────────────

const SEV: Record<InsightSeverity, {
  label: string;
  border: string;
  badge: string;
  actionBg: string;
  scienceColor: string;
}> = {
  excellent: {
    label: 'Отлично',
    border: 'border-l-green-500',
    badge: 'bg-green-500/15 text-green-400 border-green-500/30',
    actionBg: 'bg-green-500/8',
    scienceColor: 'text-green-900',
  },
  good: {
    label: 'Хорошо',
    border: 'border-l-green-400',
    badge: 'bg-green-400/15 text-green-300 border-green-400/30',
    actionBg: 'bg-green-400/8',
    scienceColor: 'text-[#3a3a3a]',
  },
  warning: {
    label: 'Внимание',
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    actionBg: 'bg-amber-500/8',
    scienceColor: 'text-[#3a3a3a]',
  },
  danger: {
    label: 'Важно',
    border: 'border-l-red-500',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    actionBg: 'bg-red-500/8',
    scienceColor: 'text-[#3a3a3a]',
  },
  info: {
    label: 'Совет',
    border: 'border-l-[#FF5722]',
    badge: 'bg-[#FF5722]/15 text-[#FF5722] border-[#FF5722]/30',
    actionBg: 'bg-[#FF5722]/8',
    scienceColor: 'text-[#3a3a3a]',
  },
};

// ── InsightCard ──────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const [scienceOpen, setScienceOpen] = useState(false);
  const cfg = SEV[insight.severity];

  // Format body: split on \n for line breaks
  const bodyLines = insight.body.split('\n');

  return (
    <div className={`bg-[#111] border border-[#1A1A1A] rounded-2xl overflow-hidden border-l-4 ${cfg.border}`}>
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl leading-none shrink-0 mt-0.5">{insight.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0 ${cfg.badge}`}>
                {cfg.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white leading-snug">{insight.title}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="ml-9 space-y-1 mb-3">
          {bodyLines.map((line, i) => (
            <p key={i} className="text-sm text-[#888] leading-relaxed">{line}</p>
          ))}
        </div>

        {/* Action */}
        <div className={`ml-9 rounded-xl px-3 py-2.5 ${cfg.actionBg} border border-white/5`}>
          <p className="text-xs text-white/80 leading-relaxed">
            <span className="font-semibold text-white">→ </span>
            {insight.action}
          </p>
        </div>

        {/* Science toggle */}
        <button
          onClick={() => setScienceOpen(v => !v)}
          className="ml-9 mt-2 flex items-center gap-1 text-[#444] hover:text-[#666] transition-colors"
        >
          <span className="text-[10px]">📚</span>
          <span className="text-[10px]">Научное обоснование</span>
          <span className="text-[10px]">{scienceOpen ? '▲' : '▼'}</span>
        </button>
        {scienceOpen && (
          <p className="ml-9 mt-1 text-[11px] text-[#555] leading-relaxed italic">
            {insight.science}
          </p>
        )}
      </div>
    </div>
  );
}

// ── data loading ─────────────────────────────────────────────────────────────

async function loadSetsCached(userId: string): Promise<WorkoutSet[]> {
  const sets = await localDb.getAllSetsByUser(userId);
  return sets.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function loadSetsFromSupabase(): Promise<WorkoutSet[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) throw new Error('fetch failed');
  await localDb.upsertSets(data);
  return data;
}

// ── InsightsClient ───────────────────────────────────────────────────────────

export default function InsightsClient() {
  const router = useRouter();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      const uid = session.user.id;
      setUserId(uid);

      // IndexedDB first — instant
      loadSetsCached(uid).then(sets => {
        if (sets.length > 0) {
          setInsights(computeInsights(sets));
          setLoading(false);
        }
      });

      // Supabase refresh silently
      loadSetsFromSupabase()
        .then(sets => { setInsights(computeInsights(sets)); setLoading(false); })
        .catch(() => setLoading(false));
    });
  }, [router]);

  // Severity counts for summary chips
  const counts = {
    danger:  insights.filter(i => i.severity === 'danger').length,
    warning: insights.filter(i => i.severity === 'warning').length,
    good:    insights.filter(i => i.severity === 'excellent' || i.severity === 'good').length,
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-[#0A0A0A] z-10 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-2 px-4 pt-2 pb-2">
          <Link
            href="/"
            className="flex items-center gap-1 h-11 pl-1 pr-3 -ml-1 rounded-xl text-[#888] hover:text-white active:bg-white/5 transition-colors text-sm font-medium shrink-0"
          >
            <span className="text-lg leading-none">‹</span>
            <span>Назад</span>
          </Link>
          <span className="text-white font-semibold">Советы</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[#444] text-sm">Анализируем данные...</div>
        </div>
      )}

      {/* No data */}
      {!loading && insights.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <span className="text-5xl">🧪</span>
          <p className="text-[#888] text-sm text-center">
            Нужно больше данных для анализа.{'\n'}Добавь несколько тренировок.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-[#FF5722] text-white font-semibold rounded-xl text-sm active:scale-95 transition-all"
          >
            Добавить подход
          </Link>
        </div>
      )}

      {/* Content */}
      {!loading && insights.length > 0 && (
        <main className="flex-1 px-4 pt-4 pb-10 space-y-3">
          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap mb-1">
            {counts.danger > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                {counts.danger} важных
              </span>
            )}
            {counts.warning > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                {counts.warning} предупреждений
              </span>
            )}
            {counts.good > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/25">
                {counts.good} всё хорошо
              </span>
            )}
            <span className="text-xs px-3 py-1 rounded-full bg-[#1A1A1A] text-[#666] border border-[#222]">
              {insights.length} советов
            </span>
          </div>

          {/* Cards */}
          {insights.map(insight => (
            <InsightCard key={insight.id} insight={insight} />
          ))}

          {/* Footer note */}
          <p className="text-[11px] text-[#333] text-center pt-2 pb-4 leading-relaxed">
            Советы основаны на данных твоих тренировок и спортивной науке.{'\n'}Не заменяют консультацию тренера.
          </p>
        </main>
      )}
    </div>
  );
}
