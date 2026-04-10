'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePreferences, type UserPreferences, type ExerciseLayout, type AppTheme } from '@/lib/preferences';
import { useTheme } from '@/components/ThemeProvider';
import ClientBanner from '@/components/ClientBanner';

function ListPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { icon: '🏋️', name: 'Жим лёжа', last: '60 кг · 8' },
        { icon: '🦵', name: 'Приседания', last: '80 кг · 5' },
        { icon: '💪', name: 'Подтягивания', last: '10 повт.' },
      ].map((ex) => (
        <div key={ex.name} className="flex items-center gap-2.5 bg-[var(--t-bg)] rounded-lg px-2.5 py-2">
          <span className="text-base leading-none">{ex.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-[var(--t-text)] truncate">{ex.name}</div>
            <div className="text-[10px] text-[var(--t-faint)]">{ex.last}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function GridPreview() {
  return (
    <div className="grid grid-cols-2 gap-1.5 mt-3">
      {[
        { icon: '🏋️', name: 'Жим лёжа', last: '60 кг · 8' },
        { icon: '🦵', name: 'Приседания', last: '80 кг · 5' },
        { icon: '💪', name: 'Подтягивания', last: '10 повт.' },
        { icon: '🔝', name: 'Жим плечами', last: '—' },
      ].map((ex) => (
        <div key={ex.name} className="bg-[var(--t-bg)] rounded-lg p-2.5">
          <span className="text-xl leading-none block mb-1.5">{ex.icon}</span>
          <div className="text-[11px] font-semibold text-[var(--t-text)] leading-tight mb-1">{ex.name}</div>
          <div className="text-[10px] text-[var(--t-faint)]">{ex.last}</div>
        </div>
      ))}
    </div>
  );
}

const LAYOUT_OPTIONS: { value: ExerciseLayout; label: string; hint: string; Preview: () => React.ReactElement }[] = [
  {
    value: 'list',
    label: 'Список',
    hint: 'Компактно, больше упражнений на экране',
    Preview: ListPreview,
  },
  {
    value: 'grid',
    label: 'Сетка',
    hint: 'Карточки в две колонки, крупнее',
    Preview: GridPreview,
  },
];

const THEME_OPTIONS: { value: AppTheme; label: string; icon: string }[] = [
  { value: 'dark',   label: 'Тёмная', icon: '🌙' },
  { value: 'light',  label: 'Светлая', icon: '☀️' },
  { value: 'system', label: 'Авто',   icon: '⚙️' },
];

export default function SettingsClient({ initialPreferences }: { initialPreferences: UserPreferences }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [layout, setLayout] = useState<ExerciseLayout>(initialPreferences.exerciseLayout);
  const [showNextSetRec, setShowNextSetRec] = useState(initialPreferences.showNextSetRec);

  function handleLayoutSelect(value: ExerciseLayout) {
    setLayout(value);
    updatePreferences({ exerciseLayout: value });
    router.refresh();
  }

  function handleThemeSelect(value: AppTheme) {
    setTheme(value);
  }

  function handleNextSetRecToggle() {
    const next = !showNextSetRec;
    setShowNextSetRec(next);
    updatePreferences({ showNextSetRec: next });
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-10">
        <header className="flex items-center gap-2 px-4 py-1 bg-[var(--t-bg-alpha)] backdrop-blur-md border-b border-[var(--t-border)]">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 h-11 pl-1 pr-3 -ml-1 rounded-xl text-[var(--t-muted)] hover:text-[var(--t-text)] active:bg-[var(--t-overlay)] transition-colors text-sm font-medium"
          >
            <span className="text-lg leading-none">‹</span>
            <span>Назад</span>
          </button>
          <span className="text-[var(--t-text)] font-semibold">Настройки</span>
        </header>
        <ClientBanner />
      </div>

      <main className="flex-1 px-4 py-5 space-y-6">

        {/* Theme */}
        <section>
          <p className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-3">
            Тема оформления
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon }) => {
              const selected = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => handleThemeSelect(value)}
                  className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
                    selected
                      ? 'border-[#FF5722] bg-[#FF5722]/8'
                      : 'border-[var(--t-border)] bg-[var(--t-card)] hover:border-[var(--t-border3)]'
                  }`}
                >
                  <span className="text-2xl leading-none">{icon}</span>
                  <span className={`text-xs font-semibold ${selected ? 'text-[#FF5722]' : 'text-[var(--t-text)]'}`}>
                    {label}
                  </span>
                  {selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--t-icon)] mt-2">Авто — следует системным настройкам устройства</p>
        </section>

        {/* Layout */}
        <section>
          <p className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-3">
            Отображение упражнений
          </p>
          <div className="grid grid-cols-2 gap-3">
            {LAYOUT_OPTIONS.map(({ value, label, hint, Preview }) => {
              const selected = layout === value;
              return (
                <button
                  key={value}
                  onClick={() => handleLayoutSelect(value)}
                  className={`text-left rounded-2xl border p-3 transition-all active:scale-95 ${
                    selected
                      ? 'border-[#FF5722] bg-[#FF5722]/8'
                      : 'border-[var(--t-border)] bg-[var(--t-card)] hover:border-[var(--t-border3)]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-semibold ${selected ? 'text-[#FF5722]' : 'text-[var(--t-text)]'}`}>
                      {label}
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selected ? 'border-[#FF5722] bg-[#FF5722]' : 'border-[var(--t-icon)]'
                    }`}>
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--t-faint)] leading-snug">{hint}</p>
                  <Preview />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[var(--t-icon)] mt-2">Применяется сразу, сохраняется автоматически</p>
        </section>

        {/* Recommendations */}
        <section>
          <p className="text-xs font-semibold text-[var(--t-faint)] uppercase tracking-wider mb-3">
            Тренировки
          </p>
          <div className="bg-[var(--t-card)] border border-[var(--t-border)] rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--t-text)]">Рекомендации подхода</p>
              <p className="text-xs text-[var(--t-faint)] mt-0.5">Показывать вес и повторения для следующего подхода</p>
            </div>
            <button
              onClick={handleNextSetRecToggle}
              className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                showNextSetRec ? 'bg-[#FF5722]' : 'bg-[var(--t-border3)]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                showNextSetRec ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
