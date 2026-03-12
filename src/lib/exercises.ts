import type { Exercise, MuscleGroup } from '@/types';

function m(primary: MuscleGroup[], secondary: MuscleGroup[] = []) {
  return { primary, secondary };
}

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench_press',      nameKey: 'exercises.bench_press',      icon: '🏋️', category: 'chest',     muscles: m(['chest', 'triceps', 'front_delts']) },
  { id: 'incline_press',    nameKey: 'exercises.incline_press',    icon: '📐', category: 'chest',     muscles: m(['chest', 'front_delts', 'triceps']) },
  { id: 'decline_press',    nameKey: 'exercises.decline_press',    icon: '📉', category: 'chest',     muscles: m(['chest', 'triceps'], ['front_delts']) },
  { id: 'dumbbell_fly',     nameKey: 'exercises.dumbbell_fly',     icon: '🦅', category: 'chest',     muscles: m(['chest'], ['front_delts', 'biceps']) },
  { id: 'cable_fly',        nameKey: 'exercises.cable_fly',        icon: '🔗', category: 'chest',     muscles: m(['chest'], ['front_delts']) },
  { id: 'push_up',          nameKey: 'exercises.push_up',          icon: '🤸', category: 'chest',     muscles: m(['chest', 'triceps', 'front_delts'], ['abs']) },
  { id: 'pec_deck',         nameKey: 'exercises.pec_deck',         icon: '🦋', category: 'chest',     muscles: m(['chest'], ['front_delts']) },
  { id: 'dip',              nameKey: 'exercises.dip',              icon: '🔽', category: 'chest',     muscles: m(['chest', 'triceps'], ['front_delts']) },

  // Legs
  { id: 'squat',            nameKey: 'exercises.squat',            icon: '🦵', category: 'legs',      muscles: m(['quads', 'glutes'], ['hamstrings', 'lower_back', 'calves']) },
  { id: 'leg_press',        nameKey: 'exercises.leg_press',        icon: '🦿', category: 'legs',      muscles: m(['quads', 'glutes'], ['hamstrings', 'calves']) },
  { id: 'romanian_deadlift',nameKey: 'exercises.romanian_deadlift',icon: '🇷🇴', category: 'legs',      muscles: m(['hamstrings', 'glutes'], ['lower_back', 'calves']) },
  { id: 'leg_curl',         nameKey: 'exercises.leg_curl',         icon: '🌀', category: 'legs',      muscles: m(['hamstrings'], ['glutes', 'calves']) },
  { id: 'leg_extension',    nameKey: 'exercises.leg_extension',    icon: '🦾', category: 'legs',      muscles: m(['quads']) },
  { id: 'calf_raise',       nameKey: 'exercises.calf_raise',       icon: '👣', category: 'legs',      muscles: m(['calves']) },
  { id: 'lunge',            nameKey: 'exercises.lunge',            icon: '🚶', category: 'legs',      muscles: m(['quads', 'glutes'], ['hamstrings', 'calves']) },
  { id: 'hack_squat',       nameKey: 'exercises.hack_squat',       icon: '⚙️', category: 'legs',      muscles: m(['quads', 'glutes'], ['hamstrings', 'calves']) },
  { id: 'front_squat',      nameKey: 'exercises.front_squat',      icon: '🏅', category: 'legs',      muscles: m(['quads'], ['glutes', 'abs', 'upper_back']) },
  { id: 'glute_bridge',     nameKey: 'exercises.glute_bridge',     icon: '🍑', category: 'legs',      muscles: m(['glutes', 'hamstrings'], ['lower_back', 'calves']) },

  // Back
  { id: 'deadlift',         nameKey: 'exercises.deadlift',         icon: '⚡', category: 'back',      muscles: m(['lower_back', 'glutes', 'hamstrings'], ['quads', 'upper_back', 'lats', 'forearms']) },
  { id: 'barbell_row',      nameKey: 'exercises.barbell_row',      icon: '🔄', category: 'back',      muscles: m(['lats', 'upper_back'], ['biceps', 'rear_delts', 'lower_back', 'forearms']) },
  { id: 'lat_pulldown',     nameKey: 'exercises.lat_pulldown',     icon: '⬇️', category: 'back',      muscles: m(['lats'], ['biceps', 'upper_back', 'rear_delts']) },
  { id: 'pull_up',          nameKey: 'exercises.pull_up',          icon: '🆙', category: 'back',      muscles: m(['lats', 'biceps'], ['upper_back', 'rear_delts', 'forearms']) },
  { id: 'cable_row',        nameKey: 'exercises.cable_row',        icon: '↔️', category: 'back',      muscles: m(['lats', 'upper_back'], ['biceps', 'rear_delts']) },
  { id: 't_bar_row',        nameKey: 'exercises.t_bar_row',        icon: '🔩', category: 'back',      muscles: m(['lats', 'upper_back'], ['biceps', 'rear_delts', 'lower_back']) },
  { id: 'dumbbell_row',     nameKey: 'exercises.dumbbell_row',     icon: '🏃', category: 'back',      muscles: m(['lats', 'upper_back'], ['biceps', 'rear_delts']) },
  { id: 'hyperextension',   nameKey: 'exercises.hyperextension',   icon: '🌉', category: 'back',      muscles: m(['lower_back', 'glutes'], ['hamstrings']) },
  { id: 'face_pull',        nameKey: 'exercises.face_pull',        icon: '🎯', category: 'back',      muscles: m(['rear_delts', 'upper_back'], ['biceps']) },
  { id: 'straight_arm_pulldown', nameKey: 'exercises.straight_arm_pulldown', icon: '📡', category: 'back', muscles: m(['lats'], ['triceps', 'abs']) },

  // Shoulders
  { id: 'overhead_press',   nameKey: 'exercises.overhead_press',   icon: '🙌', category: 'shoulders', muscles: m(['front_delts', 'triceps'], ['side_delts', 'upper_back']) },
  { id: 'lateral_raise',    nameKey: 'exercises.lateral_raise',    icon: '🕊️', category: 'shoulders', muscles: m(['side_delts'], ['front_delts', 'upper_back']) },
  { id: 'front_raise',      nameKey: 'exercises.front_raise',      icon: '⬆️', category: 'shoulders', muscles: m(['front_delts'], ['side_delts']) },
  { id: 'rear_delt_fly',    nameKey: 'exercises.rear_delt_fly',    icon: '🦆', category: 'shoulders', muscles: m(['rear_delts'], ['upper_back']) },
  { id: 'arnold_press',     nameKey: 'exercises.arnold_press',     icon: '🤜', category: 'shoulders', muscles: m(['front_delts', 'side_delts', 'triceps'], ['upper_back']) },
  { id: 'shrug',            nameKey: 'exercises.shrug',            icon: '🤷', category: 'shoulders', muscles: m(['upper_back'], ['forearms']) },
  { id: 'upright_row',      nameKey: 'exercises.upright_row',      icon: '🪝', category: 'shoulders', muscles: m(['side_delts', 'upper_back'], ['front_delts', 'biceps']) },

  // Arms
  { id: 'bicep_curl',       nameKey: 'exercises.bicep_curl',       icon: '💪', category: 'arms',      muscles: m(['biceps'], ['forearms']) },
  { id: 'tricep_pushdown',  nameKey: 'exercises.tricep_pushdown',  icon: '📏', category: 'arms',      muscles: m(['triceps'], ['forearms']) },
  { id: 'hammer_curl',      nameKey: 'exercises.hammer_curl',      icon: '🔨', category: 'arms',      muscles: m(['biceps', 'forearms']) },
  { id: 'preacher_curl',    nameKey: 'exercises.preacher_curl',    icon: '🪑', category: 'arms',      muscles: m(['biceps'], ['forearms']) },
  { id: 'skull_crusher',    nameKey: 'exercises.skull_crusher',    icon: '💀', category: 'arms',      muscles: m(['triceps']) },
  { id: 'tricep_overhead',  nameKey: 'exercises.tricep_overhead',  icon: '🏹', category: 'arms',      muscles: m(['triceps']) },
  { id: 'close_grip_bench', nameKey: 'exercises.close_grip_bench', icon: '🤝', category: 'arms',      muscles: m(['triceps', 'chest'], ['front_delts']) },
  { id: 'cable_curl',       nameKey: 'exercises.cable_curl',       icon: '🔌', category: 'arms',      muscles: m(['biceps'], ['forearms']) },

  // Core
  { id: 'plank',            nameKey: 'exercises.plank',            icon: '🪵', category: 'core',      muscles: m(['abs'], ['obliques', 'lower_back', 'glutes']) },
  { id: 'crunch',           nameKey: 'exercises.crunch',           icon: '🔁', category: 'core',      muscles: m(['abs'], ['obliques']) },
  { id: 'leg_raise',        nameKey: 'exercises.leg_raise',        icon: '🦵', category: 'core',      muscles: m(['abs'], ['obliques']) },
  { id: 'ab_wheel',         nameKey: 'exercises.ab_wheel',         icon: '🎡', category: 'core',      muscles: m(['abs'], ['obliques', 'lower_back', 'lats']) },
  { id: 'russian_twist',    nameKey: 'exercises.russian_twist',    icon: '🌪️', category: 'core',      muscles: m(['obliques'], ['abs']) },
  { id: 'cable_crunch',     nameKey: 'exercises.cable_crunch',     icon: '⚡', category: 'core',      muscles: m(['abs'], ['obliques']) },
  { id: 'hanging_leg_raise',nameKey: 'exercises.hanging_leg_raise',icon: '🪢', category: 'core',      muscles: m(['abs', 'obliques'], ['forearms', 'lats']) },
];

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

export const CATEGORY_ORDER: Exercise['category'][] = [
  'chest',
  'legs',
  'back',
  'shoulders',
  'arms',
  'core',
];
