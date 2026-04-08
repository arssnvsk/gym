import type { WorkoutSet, Exercise, MuscleGroup } from '@/types';

export type InsightSeverity = 'excellent' | 'good' | 'warning' | 'danger' | 'info';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  icon: string;
  title: string;
  body: string;
  action: string;
  science: string;
  priority: number; // lower = shown first
}

// ── helpers ────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86_400_000
  );
}

function calcVolume(sets: WorkoutSet[]): number {
  const bw = sets.every(s => s.weight === 0);
  return sets.reduce((acc, s) => acc + (bw ? s.reps : s.weight * s.reps), 0);
}

function getTodayStr(): string {
  const n = new Date();
  return [n.getFullYear(), String(n.getMonth() + 1).padStart(2, '0'), String(n.getDate()).padStart(2, '0')].join('-');
}

function nDaysAgo(n: number, from: string): string {
  const d = new Date(from + 'T12:00:00');
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const MUSCLE_NAMES: Partial<Record<MuscleGroup, string>> = {
  chest: 'Грудь',
  lats: 'Широчайшие',
  upper_back: 'Верх спины',
  lower_back: 'Поясница',
  quads: 'Квадрицепсы',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  front_delts: 'Пер. дельты',
  side_delts: 'Сред. дельты',
  rear_delts: 'Зад. дельты',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  abs: 'Пресс',
  obliques: 'Косые',
  calves: 'Икры',
  forearms: 'Предплечья',
};

const MAJOR_MUSCLES: MuscleGroup[] = [
  'chest', 'lats', 'upper_back', 'quads', 'hamstrings',
  'glutes', 'front_delts', 'side_delts', 'rear_delts',
  'biceps', 'triceps', 'abs',
];

function mName(m: MuscleGroup): string {
  return MUSCLE_NAMES[m] ?? m;
}

// ── readiness (also used on home page) ────────────────────────────────────

export interface ReadinessInfo {
  ready: MuscleGroup[];      // recovered ≥ 48 h ago — good to train
  recovering: MuscleGroup[]; // trained < 48 h ago — still healing
  fresh: MuscleGroup[];      // never trained
}

export function computeReadiness(allSets: WorkoutSet[], exercises: Exercise[]): ReadinessInfo {
  const today = getTodayStr();
  const sorted = [...allSets].sort((a, b) => a.created_at.localeCompare(b.created_at));

  const muscleLastTrained = new Map<MuscleGroup, string>();
  for (const s of sorted) {
    const d = s.created_at.slice(0, 10);
    const ex = exercises.find(e => e.id === s.exercise_id);
    if (!ex) continue;
    for (const m of ex.muscles.primary) {
      if (!muscleLastTrained.has(m) || d > muscleLastTrained.get(m)!) {
        muscleLastTrained.set(m, d);
      }
    }
  }

  const ready: MuscleGroup[] = [];
  const recovering: MuscleGroup[] = [];
  const fresh: MuscleGroup[] = MAJOR_MUSCLES.filter(m => !muscleLastTrained.has(m));

  for (const [muscle, last] of muscleLastTrained) {
    if (!MAJOR_MUSCLES.includes(muscle)) continue;
    if (daysBetween(last, today) >= 2) ready.push(muscle);
    else recovering.push(muscle);
  }

  return { ready, recovering, fresh };
}

// ── main function ──────────────────────────────────────────────────────────

export function computeInsights(allSets: WorkoutSet[], exercises: Exercise[]): Insight[] {
  if (allSets.length === 0) return [];

  const today = getTodayStr();
  const insights: Insight[] = [];

  const sorted = [...allSets].sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Unique training dates (all time)
  const allDates = [...new Set(sorted.map(s => s.created_at.slice(0, 10)))].sort();
  const lastDate = allDates[allDates.length - 1];

  // Sets indexed by date and by exercise
  const byDate = new Map<string, WorkoutSet[]>();
  const byExercise = new Map<string, WorkoutSet[]>();
  for (const s of sorted) {
    const d = s.created_at.slice(0, 10);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(s);
    if (!byExercise.has(s.exercise_id)) byExercise.set(s.exercise_id, []);
    byExercise.get(s.exercise_id)!.push(s);
  }

  // Window helpers
  const start28 = nDaysAgo(28, today);
  const start7  = nDaysAgo(7, today);
  const start30 = nDaysAgo(30, today);

  const recentDates = allDates.filter(d => d >= start28);
  const sets28 = sorted.filter(s => s.created_at.slice(0, 10) >= start28);
  const sets7  = sorted.filter(s => s.created_at.slice(0, 10) >= start7);

  // ── 1. Перерыв между тренировками ────────────────────────────────────────
  {
    if (lastDate !== today) {
      const gap = daysBetween(lastDate, today);
      if (gap >= 10) {
        insights.push({
          id: 'long_absence',
          severity: 'danger',
          icon: '🚨',
          title: `${gap} дней без тренировки`,
          body: `Последняя тренировка была ${gap} дней назад. После 10+ дней перерыва начинается детренированность: падают нейромышечные адаптации и снижается синтез белка в мышцах.`,
          action: 'Вернись к тренировкам сегодня, но начни с 60–70% от привычного объёма — это снизит DOMS и риск травмы.',
          science: 'Mujika & Padilla (2000): нейромышечные показатели начинают ухудшаться уже через 7–10 дней без нагрузки.',
          priority: 1,
        });
      } else if (gap >= 5) {
        insights.push({
          id: 'moderate_gap',
          severity: 'warning',
          icon: '📅',
          title: `${gap} дней без тренировки`,
          body: `Ты не тренировался уже ${gap} дней. Анаболический импульс от последней тренировки давно затух — тело перешло в режим поддержания.`,
          action: 'Хороший момент тренироваться. Мышцы полностью восстановились — можно работать на полную.',
          science: 'Churchward-Venne et al. (2012): синтез мышечного белка возвращается к базовому уровню через 36–48 ч после тренировки.',
          priority: 2,
        });
      }
    }
  }

  // ── 2. Частота тренировок (последние 4 недели) ───────────────────────────
  if (allDates.length >= 4) {
    const weeksSpan = Math.max(1, Math.min(4, daysBetween(recentDates[0] ?? start28, today) / 7));
    const freqPerWeek = recentDates.length / weeksSpan;

    if (freqPerWeek < 2) {
      insights.push({
        id: 'low_frequency',
        severity: 'warning',
        icon: '📉',
        title: 'Редкие тренировки',
        body: `Средняя частота за 4 недели — ${freqPerWeek.toFixed(1)} тренировки в неделю. Это ниже оптимума для роста мышц и развития силы.`,
        action: 'Постепенно выйди на 3–4 тренировки в неделю. Начни с добавления одной дополнительной тренировки.',
        science: 'Schoenfeld et al. (2016, meta-analysis): тренировка каждой группы мышц 2× в неделю даёт значительно лучший прирост массы, чем 1×.',
        priority: 3,
      });
    } else if (freqPerWeek > 6) {
      insights.push({
        id: 'overtraining_risk',
        severity: 'danger',
        icon: '🔥',
        title: 'Риск перетренированности',
        body: `${freqPerWeek.toFixed(1)} тренировок в неделю — очень высокая нагрузка. Без достаточного восстановления рост прекращается, а риск травм и перегорания растёт.`,
        action: 'Добавь 1–2 полных дня отдыха в неделю. Раз в 4–6 недель делай "разгрузочную" неделю с 50% объёма.',
        science: 'Kreher & Schwartz (2012): синдром перетренированности проявляется снижением результатов несмотря на рост объёма нагрузки.',
        priority: 1,
      });
    } else {
      insights.push({
        id: 'good_frequency',
        severity: 'excellent',
        icon: '✅',
        title: `Отличная частота — ${freqPerWeek.toFixed(1)}× в неделю`,
        body: 'Ты тренируешься в научно оптимальном диапазоне для гипертрофии и силы. Главное — следи за прогрессивной перегрузкой.',
        action: 'Поддерживай текущую частоту и фокусируйся на увеличении рабочих весов или объёма каждые 1–2 недели.',
        science: 'Ralston et al. (2017): 3–5 тренировок в неделю оптимальны для атлетов среднего уровня по соотношению стимул/восстановление.',
        priority: 9,
      });
    }
  }

  // ── 3. Прогрессивная перегрузка ──────────────────────────────────────────
  if (allDates.length >= 3) {
    let plateauCount = 0;
    let progressCount = 0;
    let analyzed = 0;

    for (const [exId, sets] of byExercise) {
      const sessionDates = [...new Set(sets.map(s => s.created_at.slice(0, 10)))].sort();
      if (sessionDates.length < 3) continue;
      analyzed++;

      const last3 = sessionDates.slice(-3).map(d => {
        const daySets = sets.filter(s => s.created_at.slice(0, 10) === d);
        return calcVolume(daySets);
      });

      const delta = (last3[2] - last3[0]) / (last3[0] || 1);
      if (delta > 0.03) progressCount++;
      else plateauCount++;
    }

    if (analyzed >= 2) {
      const plateauRatio = plateauCount / analyzed;
      if (plateauRatio > 0.65) {
        insights.push({
          id: 'plateau',
          severity: 'warning',
          icon: '📊',
          title: 'Плато — нет роста в большинстве упражнений',
          body: `${plateauCount} из ${analyzed} упражнений не показывают роста объёма в последних 3 сессиях. Без прогрессии тело адаптируется и перестаёт реагировать на нагрузку.`,
          action: 'Добавь +1–2 кг к рабочим весам или +1–2 повторения. Если это невозможно — измени диапазон (с 8–12 на 4–6 или 15–20) или добавь рабочий подход.',
          science: 'Kraemer & Ratamess (2004): прогрессивная перегрузка — фундаментальный принцип нейромышечной адаптации. Без систематического роста нагрузки гипертрофия невозможна.',
          priority: 3,
        });
      } else if (progressCount / analyzed > 0.6) {
        insights.push({
          id: 'progressing',
          severity: 'excellent',
          icon: '🚀',
          title: 'Прогрессивная перегрузка работает',
          body: `${progressCount} из ${analyzed} упражнений показывают устойчивый рост. Это главный драйвер мышечной гипертрофии — ты делаешь всё правильно.`,
          action: 'Продолжай фиксировать веса и повторения в каждой сессии. Не пропускай подходы — объём важен.',
          science: 'NSCA (2017): прогрессивная перегрузка — ключевой принцип силовых адаптаций согласно всем современным руководствам.',
          priority: 8,
        });
      }
    }
  }

  // ── 4. Баланс "тяга vs жим" (горизонтальный) ────────────────────────────
  if (sets28.length > 0) {
    const muscleVol = new Map<MuscleGroup, number>();
    for (const s of sets28) {
      const ex = exercises.find(e => e.id === s.exercise_id);
      if (!ex) continue;
      const v = s.weight > 0 ? s.weight * s.reps : s.reps;
      for (const m of ex.muscles.primary) muscleVol.set(m, (muscleVol.get(m) ?? 0) + v);
    }

    const pushMuscles: MuscleGroup[] = ['chest', 'front_delts', 'triceps', 'side_delts'];
    const pullMuscles: MuscleGroup[] = ['lats', 'upper_back', 'biceps', 'rear_delts'];
    const pushVol = pushMuscles.reduce((a, m) => a + (muscleVol.get(m) ?? 0), 0);
    const pullVol = pullMuscles.reduce((a, m) => a + (muscleVol.get(m) ?? 0), 0);

    if (pushVol > 0 && pullVol > 0) {
      const ratio = pushVol / pullVol;
      if (ratio > 1.7) {
        insights.push({
          id: 'push_pull_imbalance',
          severity: 'warning',
          icon: '⚖️',
          title: 'Мало тяговых упражнений',
          body: `Объём жимовых упражнений в ${ratio.toFixed(1)}× больше тяговых. Дисбаланс ослабляет задние дельты и ромбовидные мышцы, нарушает осанку и создаёт риск травм плечевого сустава.`,
          action: 'Добавь горизонтальные тяги (кабельная тяга, тяга гантели) и вертикальные (подтягивания, тяга блока). Целься в соотношение тяга:жим не хуже 1:1.',
          science: 'Kibler et al. (2006): превышение объёма жима над тягой нарушает стабильность лопатки и ротаторной манжеты плеча.',
          priority: 4,
        });
      } else if (ratio < 0.6) {
        insights.push({
          id: 'pull_push_imbalance',
          severity: 'warning',
          icon: '⚖️',
          title: 'Мало жимовых упражнений',
          body: `Тяговый объём в ${(1 / ratio).toFixed(1)}× больше жимового. Слабая грудь и передние дельты — частая причина сутулости и дисбаланса верха тела.`,
          action: 'Добавь горизонтальный и вертикальный жим. Минимум одно жимовое упражнение на каждую тренировку верха тела.',
          science: 'Cressey (2010): баланс между антагонистами критичен для здоровья суставов и симметричного мышечного развития.',
          priority: 4,
        });
      }
    }

    // Квадрицепсы vs бицепс бедра
    const quadVol = muscleVol.get('quads') ?? 0;
    const hamVol  = muscleVol.get('hamstrings') ?? 0;
    if (quadVol > 0 && hamVol > 0 && quadVol / hamVol > 2.2) {
      insights.push({
        id: 'quad_ham_imbalance',
        severity: 'warning',
        icon: '🦵',
        title: 'Слабый бицепс бедра — риск колена',
        body: `Объём на квадрицепсы в ${(quadVol / hamVol).toFixed(1)}× превышает нагрузку на заднюю поверхность бедра. Это один из главных факторов риска травмы ACL (крестообразной связки).`,
        action: 'Добавь румынскую тягу, сгибания ног лёжа или SLDL в каждую тренировку ног. Цель: соотношение квад/бицепс бедра не хуже 1.5:1.',
        science: 'Hewett et al. (2008): дисбаланс квадрицепс/хамстринг > 2:1 — один из сильнейших предикторов травм колена у спортсменов.',
        priority: 3,
      });
    }
  }

  // ── 5. Непроработанные крупные мышцы (30 дней) ───────────────────────────
  {
    const trained30 = new Set<MuscleGroup>();
    for (const s of sorted.filter(s => s.created_at.slice(0, 10) >= start30)) {
      const ex = exercises.find(e => e.id === s.exercise_id);
      if (ex) ex.muscles.primary.forEach(m => trained30.add(m));
    }
    const untrained = MAJOR_MUSCLES.filter(m => !trained30.has(m));
    if (untrained.length > 0) {
      const names = untrained.map(mName).join(', ');
      insights.push({
        id: 'untrained_muscles',
        severity: untrained.length >= 3 ? 'warning' : 'info',
        icon: '🎯',
        title: `${untrained.length} ${untrained.length === 1 ? 'группа' : 'группы'} мышц без нагрузки 30+ дней`,
        body: `Эти мышцы не получали прямой нагрузки больше месяца: ${names}. Неравномерное развитие замедляет общий прогресс и увеличивает риск травм.`,
        action: `Включи упражнение на "${untrained.map(mName)[0]}" уже в следующую тренировку.`,
        science: 'ACSM Position Stand (2009): для функциональной силы и симметрии необходимо прорабатывать все основные группы мышц не реже 2× в неделю.',
        priority: 5,
      });
    }
  }

  // ── 6. Что готово к нагрузке сегодня ─────────────────────────────────────
  {
    const muscleLastTrained = new Map<MuscleGroup, string>();
    for (const s of sorted) {
      const d = s.created_at.slice(0, 10);
      const ex = exercises.find(e => e.id === s.exercise_id);
      if (!ex) continue;
      for (const m of ex.muscles.primary) {
        if (!muscleLastTrained.has(m) || d > muscleLastTrained.get(m)!) {
          muscleLastTrained.set(m, d);
        }
      }
    }

    const ready: MuscleGroup[] = [];
    const recovering: MuscleGroup[] = [];
    const fresh: MuscleGroup[] = MAJOR_MUSCLES.filter(m => !muscleLastTrained.has(m));

    for (const [muscle, last] of muscleLastTrained) {
      if (!MAJOR_MUSCLES.includes(muscle)) continue;
      const gap = daysBetween(last, today);
      if (gap >= 2) ready.push(muscle);
      else recovering.push(muscle);
    }

    if (ready.length > 0 || fresh.length > 0) {
      const trainToday = [...fresh, ...ready].slice(0, 5);
      const readyStr = trainToday.map(mName).join(', ');
      const recovStr = recovering.map(mName).join(', ');
      insights.push({
        id: 'readiness',
        severity: 'info',
        icon: '💪',
        title: 'Что тренировать сегодня',
        body: `Готовы к нагрузке: ${readyStr || '—'}.${recovStr ? `\nЕщё восстанавливаются (< 48 ч): ${recovStr}.` : ''}`,
        action: `Построй тренировку вокруг ${mName(trainToday[0])}${trainToday[1] ? ' и ' + mName(trainToday[1]) : ''}. Это будет максимально эффективно по восстановлению.`,
        science: 'Peake et al. (2017): большинство мышц при умеренной интенсивности полностью восстанавливаются за 48–72 ч. Тренировать до полного восстановления необязательно, но повторный стимул не должен быть раньше 24 ч.',
        priority: 2,
      });
    }
  }

  // ── 7. Недельный объём по мышцам ─────────────────────────────────────────
  {
    const weekSets = new Map<MuscleGroup, number>();
    for (const s of sets7) {
      const ex = exercises.find(e => e.id === s.exercise_id);
      if (!ex) continue;
      for (const m of ex.muscles.primary) weekSets.set(m, (weekSets.get(m) ?? 0) + 1);
    }

    // Muscles with some volume but below MEV (≈ 6–8 sets/week)
    const low = MAJOR_MUSCLES.filter(m => {
      const n = weekSets.get(m) ?? 0;
      return n > 0 && n < 6;
    });

    if (low.length >= 2) {
      insights.push({
        id: 'low_weekly_volume',
        severity: 'info',
        icon: '📏',
        title: 'Низкий объём за неделю',
        body: `${low.map(mName).join(', ')} получили менее 6 рабочих подходов за последние 7 дней — ниже минимального эффективного объёма (MEV).`,
        action: 'Добавь 2–3 рабочих подхода к этим группам. Лучше распределить по двум тренировкам, чем сделать всё за раз.',
        science: 'Israetel et al. (Renaissance Periodization, 2019): MEV для большинства мышечных групп — 8–10 подходов в неделю. При 12–20 подходах гипертрофия максимальна.',
        priority: 6,
      });
    }
  }

  // ── 8. Анализ причины регресса последней тренировки ──────────────────────
  if (lastDate && byDate.has(lastDate) && allDates.length >= 3) {
    const lastSets = byDate.get(lastDate)!;
    const lastExercises = new Set(lastSets.map(s => s.exercise_id));

    let regressionCount = 0;
    let comparedCount = 0;

    for (const exId of lastExercises) {
      const exSets = byExercise.get(exId) ?? [];
      const sessionDates = [...new Set(exSets.map(s => s.created_at.slice(0, 10)))].sort();
      const idx = sessionDates.indexOf(lastDate);
      if (idx < 1) continue;
      comparedCount++;

      const todayVol = calcVolume(exSets.filter(s => s.created_at.slice(0, 10) === lastDate));
      const prevVol  = calcVolume(exSets.filter(s => s.created_at.slice(0, 10) === sessionDates[idx - 1]));
      if (prevVol > 0 && todayVol / prevVol < 0.95) regressionCount++;
    }

    if (comparedCount >= 2 && regressionCount / comparedCount > 0.5) {
      // Try to find the cause
      const prevDate = allDates[allDates.indexOf(lastDate) - 1];
      const gap = prevDate ? daysBetween(prevDate, lastDate) : null;

      let cause = '';
      let causeAction = '';

      if (gap !== null && gap <= 1) {
        cause = 'Слишком короткий отдых между тренировками (меньше суток).';
        causeAction = 'Делай перерыв минимум 48 ч между тренировками одних и тех же групп мышц.';
      } else if (gap !== null && gap >= 7) {
        cause = 'Долгий перерыв перед тренировкой — тело частично детренировалось.';
        causeAction = 'После длительного перерыва нужно 1–2 "вводные" тренировки на 60–70% привычного объёма.';
      } else {
        cause = 'Возможные причины: недосыпание, стресс, недостаточное питание или скрытая усталость.';
        causeAction = 'Проверь: ты спишь 7–9 ч? Достаточно ли ешь белка (1.6–2.2 г/кг)? Нет ли накопленной усталости?';
      }

      insights.push({
        id: 'regression_analysis',
        severity: 'warning',
        icon: '🔍',
        title: 'Регресс в последней тренировке — разбор причин',
        body: `${regressionCount} из ${comparedCount} упражнений показали снижение объёма. ${cause}`,
        action: causeAction,
        science: 'Beelen et al. (2010): качество восстановления (сон, питание, стресс) напрямую влияет на силовые показатели следующей тренировки.',
        priority: 2,
      });
    }
  }

  return insights.sort((a, b) => a.priority - b.priority);
}
