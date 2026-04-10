'use client';

import { useState } from 'react';
import { updatePreferences } from '@/lib/preferences';

type SettingKey = 'showNextSetRec' | 'isTrainer';

interface Step {
  icon: string;
  bg: string;
  title: string;
  body: string;
  setting?: {
    key: SettingKey;
    label: string;
    hint: string;
  };
}

const STEPS: Step[] = [
  {
    icon: '🏋️',
    bg: '#FF5722',
    title: 'Добро пожаловать',
    body: 'Gym Tracker — персональный трекер тренировок. Записывай подходы, следи за прогрессом и становись сильнее.',
  },
  {
    icon: '➕',
    bg: '#FF5722',
    title: 'Журнал тренировок',
    body: 'Нажми «+ Добавить подход», выбери упражнение, введи вес и повторения. Всё сохраняется на устройстве — работает даже без интернета.',
  },
  {
    icon: '📊',
    bg: '#4CAF50',
    title: 'Отчёты и советы',
    body: 'В меню → «Отчёт» смотри объём тренировок по дням. В «Советах» — на какие мышцы сделать акцент прямо сейчас, исходя из восстановления.',
  },
  {
    icon: '💡',
    bg: '#FF9800',
    title: 'Рекомендации подхода',
    body: 'Приложение предлагает оптимальный вес и повторения на следующий подход на основе твоих предыдущих тренировок.',
    setting: {
      key: 'showNextSetRec',
      label: 'Рекомендации подхода',
      hint: 'Включить умные подсказки по весу и повторениям',
    },
  },
  {
    icon: '👥',
    bg: '#2196F3',
    title: 'Режим тренера',
    body: 'Управляй расписанием клиентов и ведите их тренировки прямо в приложении.',
    setting: {
      key: 'isTrainer',
      label: 'Я тренер',
      hint: 'Показывать раздел управления клиентами',
    },
  },
];

interface Props {
  initialShowNextSetRec: boolean;
  initialIsTrainer: boolean;
  onDone: () => void;
}

export default function OnboardingModal({ initialShowNextSetRec, initialIsTrainer, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [showNextSetRec, setShowNextSetRec] = useState(initialShowNextSetRec);
  const [isTrainer, setIsTrainer] = useState(initialIsTrainer);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function getSettingValue(key: SettingKey) {
    return key === 'showNextSetRec' ? showNextSetRec : isTrainer;
  }

  function handleToggle(key: SettingKey) {
    if (key === 'showNextSetRec') {
      const next = !showNextSetRec;
      setShowNextSetRec(next);
      updatePreferences({ showNextSetRec: next });
    } else {
      const next = !isTrainer;
      setIsTrainer(next);
      updatePreferences({ isTrainer: next });
    }
  }

  function finish() {
    updatePreferences({ onboardingDone: true });
    onDone();
  }

  function handleNext() {
    if (isLast) { finish(); return; }
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 150);
  }

  function handlePrev() {
    if (step === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimating(false);
    }, 150);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/75 backdrop-blur-sm px-4 pb-6">
      <div className="w-full max-w-[480px] bg-[var(--t-card)] border border-[var(--t-border)] rounded-3xl overflow-hidden shadow-2xl">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <span className="text-xs text-[var(--t-icon)]">{step + 1} / {STEPS.length}</span>
          <button
            onClick={finish}
            className="text-xs text-[var(--t-muted)] hover:text-[var(--t-text)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--t-overlay)] active:bg-[var(--t-overlay-md)]"
          >
            Пропустить
          </button>
        </div>

        {/* Content */}
        <div
          className="px-6 pt-4 pb-6 transition-opacity duration-150"
          style={{ opacity: animating ? 0 : 1 }}
        >
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-5 transition-all duration-300"
            style={{
              background: `${current.bg}1A`,
              border: `1px solid ${current.bg}40`,
            }}
          >
            {current.icon}
          </div>

          {/* Title + body */}
          <div className="text-center mb-5">
            <h2 className="text-[1.25rem] font-bold text-[var(--t-text)] mb-3 leading-tight">
              {current.title}
            </h2>
            <p className="text-[0.875rem] text-[var(--t-muted)] leading-relaxed">
              {current.body}
            </p>
          </div>

          {/* Inline toggle */}
          {current.setting && (
            <div className="bg-[var(--t-bg)] border border-[var(--t-border)] rounded-2xl px-4 py-3.5 flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-[var(--t-text)]">{current.setting.label}</p>
                <p className="text-xs text-[var(--t-faint)] mt-0.5">{current.setting.hint}</p>
              </div>
              <button
                onClick={() => handleToggle(current.setting!.key)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                  getSettingValue(current.setting.key) ? 'bg-[#FF5722]' : 'bg-[var(--t-border3)]'
                }`}
                aria-label={current.setting.label}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  getSettingValue(current.setting.key) ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          )}

          {/* Dot progress */}
          <div className="flex justify-center items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { if (!animating) setStep(i); }}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === step ? '1.25rem' : '0.375rem',
                  height: '0.375rem',
                  background: i === step ? '#FF5722' : 'var(--t-border3)',
                }}
                aria-label={`Шаг ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="w-12 flex items-center justify-center rounded-2xl border border-[var(--t-border)] bg-[var(--t-bg)] text-[var(--t-muted)] hover:text-[var(--t-text)] hover:border-[var(--t-border3)] transition-all active:scale-95 py-4"
              >
                <span className="text-lg leading-none">‹</span>
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-4 rounded-2xl bg-[#FF5722] hover:bg-[#FF6D3A] text-white font-semibold text-[0.9375rem] transition-all active:scale-95 shadow-lg shadow-[#FF5722]/30"
            >
              {isLast ? 'Начать' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
