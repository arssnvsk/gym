'use client';

import { useTranslations } from 'next-intl';
import type { MuscleGroup } from '@/types';

/* ── colours — via CSS custom properties so they respond to theme ── */
const PRIMARY   = '#FF5722';
const SECONDARY = '#7C2A10';
const BODY_FILL = 'var(--t-body-fill)';
const MUSCLE_IN = 'var(--t-muscle-in)';
const OUTLINE   = 'var(--t-outline)';
const DIVIDER   = 'var(--t-divider)';

interface Props { primary: MuscleGroup[]; secondary: MuscleGroup[] }

function gc(g: MuscleGroup, p: MuscleGroup[], s: MuscleGroup[]) {
  if (p.includes(g)) return PRIMARY;
  if (s.includes(g)) return SECONDARY;
  return MUSCLE_IN;
}

/* ── smooth body silhouette paths (viewBox 0 0 100 290) ──────── */
const HEAD   = { cx: 50, cy: 14, rx: 12, ry: 13 };
const NECK   = 'M44,25 L56,25 C56,33 55,38 55,38 L45,38 C45,38 44,33 44,25 Z';
const TORSO  = 'M16,38 C8,44 6,58 8,72 C7,108 16,136 20,153 L48,153 Q50,155 52,153 L80,153 C84,136 93,108 92,72 C94,58 92,44 84,38 Q50,35 16,38 Z';
const ARM_LU = 'M8,41 C2,50 0,66 0,82 C0,94 2,101 5,102 L18,99 C19,88 19,72 19,56 C18,48 15,41 12,39 Z';
const ARM_RU = 'M92,41 C98,50 100,66 100,82 C100,94 98,101 95,102 L82,99 C81,88 81,72 81,56 C82,48 85,41 88,39 Z';
const ARM_LF = 'M5,102 C2,114 1,128 2,140 C3,149 7,152 11,151 C16,151 19,147 19,142 L18,99 Z';
const ARM_RF = 'M95,102 C98,114 99,128 98,140 C97,149 93,152 89,151 C84,151 81,147 81,142 L82,99 Z';
const LEG_LU = 'M20,153 L47,153 C49,165 49,187 47,204 C45,218 41,226 37,228 L17,228 C14,220 13,200 14,178 C14,164 17,155 20,153 Z';
const LEG_RU = 'M80,153 L53,153 C51,165 51,187 53,204 C55,218 59,226 63,228 L83,228 C86,220 87,200 86,178 C86,164 83,155 80,153 Z';
const LEG_LC = 'M17,228 L37,228 C40,240 42,258 40,270 C38,280 33,283 27,283 C21,283 16,279 15,270 C13,258 13,240 17,228 Z';
const LEG_RC = 'M83,228 L63,228 C60,240 58,258 60,270 C62,280 67,283 73,283 C79,283 84,279 85,270 C87,258 87,240 83,228 Z';

const ALL_PATHS = [NECK,TORSO,ARM_LU,ARM_RU,ARM_LF,ARM_RF,LEG_LU,LEG_RU,LEG_LC,LEG_RC];

/* Use style={{ fill }} so the browser resolves CSS custom properties */
function BodyFill() {
  return (
    <>
      <ellipse {...HEAD} style={{ fill: BODY_FILL }} />
      {ALL_PATHS.map((d, i) => <path key={i} d={d} style={{ fill: BODY_FILL }} />)}
    </>
  );
}
function BodyStroke() {
  return (
    <>
      <ellipse {...HEAD} fill="none" style={{ stroke: OUTLINE }} strokeWidth="1.5" />
      {ALL_PATHS.map((d, i) => (
        <path key={i} d={d} fill="none" style={{ stroke: OUTLINE }} strokeWidth="1.5" strokeLinejoin="round" />
      ))}
    </>
  );
}

/* ── front view ─────────────────────────────────────────────── */
function FrontSVG({ primary: p, secondary: s }: Props) {
  const m = (g: MuscleGroup) => gc(g, p, s);
  return (
    <svg viewBox="0 0 100 290" width="80" height="232">
      <defs>
        <clipPath id="mmc-f">
          <ellipse {...HEAD} />
          {ALL_PATHS.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
      </defs>

      <BodyFill />

      <g clipPath="url(#mmc-f)">
        {/* Front delts */}
        <ellipse cx="12" cy="50" rx="9"  ry="9"  fill={m('front_delts')} stroke={DIVIDER} strokeWidth="0.5" />
        <ellipse cx="88" cy="50" rx="9"  ry="9"  fill={m('front_delts')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Side delts */}
        <ellipse cx="3"  cy="56" rx="5"  ry="7"  fill={m('side_delts')}  stroke={DIVIDER} strokeWidth="0.5" />
        <ellipse cx="97" cy="56" rx="5"  ry="7"  fill={m('side_delts')}  stroke={DIVIDER} strokeWidth="0.5" />
        {/* Chest */}
        <path d="M50,60 C44,56 30,58 24,70 C20,80 24,92 32,94 C40,96 48,90 50,82 Z"
              fill={m('chest')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M50,60 C56,56 70,58 76,70 C80,80 76,92 68,94 C60,96 52,90 50,82 Z"
              fill={m('chest')} stroke={DIVIDER} strokeWidth="0.5" />
        <line x1="50" y1="60" x2="50" y2="92" stroke={DIVIDER} strokeWidth="0.8" />
        {/* Biceps */}
        <path d="M4,56 C2,66 1,78 2,90 C3,98 7,102 11,101 C15,101 18,97 18,90 C18,78 17,64 15,56 C13,50 7,50 4,56 Z"
              fill={m('biceps')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M96,56 C98,66 99,78 98,90 C97,98 93,102 89,101 C85,101 82,97 82,90 C82,78 83,64 85,56 C87,50 93,50 96,56 Z"
              fill={m('biceps')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Forearms */}
        <path d="M5,102 C2,114 2,130 3,140 C4,148 8,151 11,151 C15,151 18,148 18,141 C18,130 18,114 17,102 Z"
              fill={m('forearms')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M95,102 C98,114 98,130 97,140 C96,148 92,151 89,151 C85,151 82,148 82,141 C82,130 82,114 83,102 Z"
              fill={m('forearms')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Abs */}
        <rect x="40" y="97"  width="9" height="11" rx="3" fill={m('abs')} stroke={DIVIDER} strokeWidth="0.5" />
        <rect x="51" y="97"  width="9" height="11" rx="3" fill={m('abs')} stroke={DIVIDER} strokeWidth="0.5" />
        <rect x="40" y="110" width="9" height="11" rx="3" fill={m('abs')} stroke={DIVIDER} strokeWidth="0.5" />
        <rect x="51" y="110" width="9" height="11" rx="3" fill={m('abs')} stroke={DIVIDER} strokeWidth="0.5" />
        <rect x="40" y="123" width="9" height="10" rx="3" fill={m('abs')} stroke={DIVIDER} strokeWidth="0.5" />
        <rect x="51" y="123" width="9" height="10" rx="3" fill={m('abs')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Obliques */}
        <path d="M22,96 C18,106 17,120 18,132 C19,140 22,145 26,144 C30,143 32,138 32,130 C32,118 29,104 26,96 Z"
              fill={m('obliques')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M78,96 C82,106 83,120 82,132 C81,140 78,145 74,144 C70,143 68,138 68,130 C68,118 71,104 74,96 Z"
              fill={m('obliques')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Quads */}
        <path d="M20,157 C18,168 15,186 16,202 C17,214 21,224 27,226 C33,228 38,224 40,214 C43,200 43,180 41,164 C39,156 28,154 20,157 Z"
              fill={m('quads')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M80,157 C82,168 85,186 84,202 C83,214 79,224 73,226 C67,228 62,224 60,214 C57,200 57,180 59,164 C61,156 72,154 80,157 Z"
              fill={m('quads')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Calves front */}
        <path d="M18,232 C17,242 16,256 17,266 C18,275 22,280 27,280 C32,280 36,275 37,266 C38,256 38,242 37,232 Z"
              fill={m('calves')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M82,232 C83,242 84,256 83,266 C82,275 78,280 73,280 C68,280 64,275 63,266 C62,256 62,242 63,232 Z"
              fill={m('calves')} stroke={DIVIDER} strokeWidth="0.5" />
      </g>

      <BodyStroke />
    </svg>
  );
}

/* ── back view ──────────────────────────────────────────────── */
function BackSVG({ primary: p, secondary: s }: Props) {
  const m = (g: MuscleGroup) => gc(g, p, s);
  return (
    <svg viewBox="0 0 100 290" width="80" height="232">
      <defs>
        <clipPath id="mmc-b">
          <ellipse {...HEAD} />
          {ALL_PATHS.map((d, i) => <path key={i} d={d} />)}
        </clipPath>
      </defs>

      <BodyFill />

      <g clipPath="url(#mmc-b)">
        {/* Rear delts */}
        <ellipse cx="12" cy="50" rx="9"  ry="9"  fill={m('rear_delts')}  stroke={DIVIDER} strokeWidth="0.5" />
        <ellipse cx="88" cy="50" rx="9"  ry="9"  fill={m('rear_delts')}  stroke={DIVIDER} strokeWidth="0.5" />
        {/* Trapezius */}
        <path d="M50,38 C40,46 22,58 22,72 C22,82 30,86 38,84 C44,82 48,76 50,68 C52,76 56,82 62,84 C70,86 78,82 78,72 C78,58 60,46 50,38 Z"
              fill={m('upper_back')} stroke={DIVIDER} strokeWidth="0.5" />
        <line x1="50" y1="40" x2="50" y2="148" stroke={DIVIDER} strokeWidth="0.8" />
        {/* Lats */}
        <path d="M20,72 C14,84 12,102 14,118 C15,128 19,134 24,133 C28,132 30,126 32,116 C34,104 34,88 32,76 C30,68 24,68 20,72 Z"
              fill={m('lats')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M80,72 C86,84 88,102 86,118 C85,128 81,134 76,133 C72,132 70,126 68,116 C66,104 66,88 68,76 C70,68 76,68 80,72 Z"
              fill={m('lats')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Lower back */}
        <path d="M44,100 C42,114 42,128 44,140 C45,147 48,150 50,150 C52,150 55,147 56,140 C58,128 58,114 56,100 C55,94 52,92 50,92 C48,92 45,94 44,100 Z"
              fill={m('lower_back')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Triceps */}
        <path d="M4,56 C2,66 1,78 2,90 C3,98 7,102 11,101 C15,101 18,97 18,90 C18,78 17,64 15,56 C13,50 7,50 4,56 Z"
              fill={m('triceps')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M96,56 C98,66 99,78 98,90 C97,98 93,102 89,101 C85,101 82,97 82,90 C82,78 83,64 85,56 C87,50 93,50 96,56 Z"
              fill={m('triceps')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Forearms */}
        <path d="M5,102 C2,114 2,130 3,140 C4,148 8,151 11,151 C15,151 18,148 18,141 C18,130 18,114 17,102 Z"
              fill={m('forearms')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M95,102 C98,114 98,130 97,140 C96,148 92,151 89,151 C85,151 82,148 82,141 C82,130 82,114 83,102 Z"
              fill={m('forearms')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Glutes */}
        <path d="M20,155 C16,163 14,174 15,183 C16,190 20,195 26,195 C32,195 36,190 38,183 C40,174 40,163 38,155 Z"
              fill={m('glutes')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M80,155 C84,163 86,174 85,183 C84,190 80,195 74,195 C68,195 64,190 62,183 C60,174 60,163 62,155 Z"
              fill={m('glutes')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Hamstrings */}
        <path d="M18,196 C15,208 14,220 16,230 C17,236 21,240 26,239 C31,238 34,233 35,226 C37,214 37,200 35,192 C32,186 22,186 18,196 Z"
              fill={m('hamstrings')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M82,196 C85,208 86,220 84,230 C83,236 79,240 74,239 C69,238 66,233 65,226 C63,214 63,200 65,192 C68,186 78,186 82,196 Z"
              fill={m('hamstrings')} stroke={DIVIDER} strokeWidth="0.5" />
        {/* Calves */}
        <path d="M18,232 C17,242 16,256 17,266 C18,275 22,280 27,280 C32,280 36,275 37,266 C38,256 38,242 37,232 Z"
              fill={m('calves')} stroke={DIVIDER} strokeWidth="0.5" />
        <path d="M82,232 C83,242 84,256 83,266 C82,275 78,280 73,280 C68,280 64,275 63,266 C62,256 62,242 63,232 Z"
              fill={m('calves')} stroke={DIVIDER} strokeWidth="0.5" />
      </g>

      <BodyStroke />
    </svg>
  );
}

/* ── legend ──────────────────────────────────────────────────── */
const NAMES_RU: Record<MuscleGroup, string> = {
  chest: 'Грудь', front_delts: 'Пер. дельты', side_delts: 'Сред. дельты',
  rear_delts: 'Зад. дельты', biceps: 'Бицепс', triceps: 'Трицепс',
  forearms: 'Предплечья', upper_back: 'Верх. спина', lats: 'Широчайшие',
  lower_back: 'Поясница', abs: 'Пресс', obliques: 'Косые',
  glutes: 'Ягодицы', quads: 'Квадрицепсы', hamstrings: 'Бицепс бедра', calves: 'Икры',
};
const NAMES_EN: Record<MuscleGroup, string> = {
  chest: 'Chest', front_delts: 'Front Delts', side_delts: 'Side Delts',
  rear_delts: 'Rear Delts', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Forearms', upper_back: 'Upper Back', lats: 'Lats',
  lower_back: 'Lower Back', abs: 'Abs', obliques: 'Obliques',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

export default function MuscleMap({ primary, secondary }: Props) {
  const t = useTranslations();
  const names = t('app.title') === 'Тренировки' ? NAMES_RU : NAMES_EN;

  return (
    <div>
      <div className="flex gap-6 justify-center mb-4">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-[var(--t-icon)] uppercase tracking-widest">{t('exercise.musclesFront')}</span>
          <FrontSVG primary={primary} secondary={secondary} />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-[var(--t-icon)] uppercase tracking-widest">{t('exercise.musclesBack')}</span>
          <BackSVG primary={primary} secondary={secondary} />
        </div>
      </div>

      <div className="space-y-1.5">
        {primary.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {primary.map((g) => (
              <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30">
                {names[g]}
              </span>
            ))}
          </div>
        )}
        {secondary.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {secondary.map((g) => (
              <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-[#7C2A10]/20 text-[#C4674A] border border-[#7C2A10]/40">
                {names[g]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
