'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updatePreferences, type UserPreferences, type ExerciseLayout } from '@/lib/preferences';

function ListPreview() {
  return (
    <div className="space-y-1.5 mt-3">
      {[
        { icon: '🏋️', name: 'Жим лёжа', last: '60 кг · 8' },
        { icon: '🦵', name: 'Приседания', last: '80 кг · 5' },
        { icon: '💪', name: 'Подтягивания', last: '10 повт.' },
      ].map((ex) => (
        <div key={ex.name} className="flex items-center gap-2.5 bg-[#0A0A0A] rounded-lg px-2.5 py-2">
          <span className="text-base leading-none">{ex.icon}</span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-white truncate">{ex.name}</div>
            <div className="text-[10px] text-[#555]">{ex.last}</div>
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
        <div key={ex.name} className="bg-[#0A0A0A] rounded-lg p-2.5">
          <span className="text-xl leading-none block mb-1.5">{ex.icon}</span>
          <div className="text-[11px] font-semibold text-white leading-tight mb-1">{ex.name}</div>
          <div className="text-[10px] text-[#555]">{ex.last}</div>
        </div>
      ))}
    </div>
  );
}

const OPTIONS: { value: ExerciseLayout; label: string; hint: string; Preview: () => React.ReactElement }[] = [
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

export default function SettingsClient({ initialPreferences }: { initialPreferences: UserPreferences }) {
  const router = useRouter();
  const [layout, setLayout] = useState<ExerciseLayout>(initialPreferences.exerciseLayout);

  function handleSelect(value: ExerciseLayout) {
    setLayout(value);
    updatePreferences({ exerciseLayout: value });
    router.refresh(); // invalidate router cache so home re-fetches SSR preferences
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#1F1F1F]">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 h-11 pl-1 pr-3 -ml-1 rounded-xl text-[#888] hover:text-white active:bg-white/5 transition-colors text-sm font-medium"
        >
          <span className="text-lg leading-none">‹</span>
          <span>Назад</span>
        </button>
        <span className="text-white font-semibold">Настройки</span>
      </header>

      <main className="flex-1 px-4 py-5 space-y-6">
        <section>
          <p className="text-xs font-semibold text-[#555] uppercase tracking-wider mb-3">
            Отображение упражнений
          </p>
          <div className="grid grid-cols-2 gap-3">
            {OPTIONS.map(({ value, label, hint, Preview }) => {
              const selected = layout === value;
              return (
                <button
                  key={value}
                  onClick={() => handleSelect(value)}
                  className={`text-left rounded-2xl border p-3 transition-all active:scale-95 ${
                    selected
                      ? 'border-[#FF5722] bg-[#FF5722]/8'
                      : 'border-[#1F1F1F] bg-[#141414] hover:border-[#333]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-sm font-semibold ${selected ? 'text-[#FF5722]' : 'text-white'}`}>
                      {label}
                    </span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      selected ? 'border-[#FF5722] bg-[#FF5722]' : 'border-[#444]'
                    }`}>
                      {selected && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#555] leading-snug">{hint}</p>
                  <Preview />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#444] mt-2">Применяется сразу, сохраняется автоматически</p>
        </section>
      </main>
    </div>
  );
}
