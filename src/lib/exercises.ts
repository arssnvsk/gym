import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench_press',      nameKey: 'exercises.bench_press',      icon: '🏋️', category: 'chest' },
  { id: 'incline_press',    nameKey: 'exercises.incline_press',    icon: '📐', category: 'chest' },
  { id: 'decline_press',    nameKey: 'exercises.decline_press',    icon: '📉', category: 'chest' },
  { id: 'dumbbell_fly',     nameKey: 'exercises.dumbbell_fly',     icon: '🦅', category: 'chest' },
  { id: 'cable_fly',        nameKey: 'exercises.cable_fly',        icon: '🔗', category: 'chest' },
  { id: 'push_up',          nameKey: 'exercises.push_up',          icon: '🤸', category: 'chest' },
  { id: 'pec_deck',         nameKey: 'exercises.pec_deck',         icon: '🦋', category: 'chest' },
  { id: 'dip',              nameKey: 'exercises.dip',              icon: '🔽', category: 'chest' },

  // Legs
  { id: 'squat',            nameKey: 'exercises.squat',            icon: '🦵', category: 'legs' },
  { id: 'leg_press',        nameKey: 'exercises.leg_press',        icon: '🦿', category: 'legs' },
  { id: 'romanian_deadlift',nameKey: 'exercises.romanian_deadlift',icon: '🇷🇴', category: 'legs' },
  { id: 'leg_curl',         nameKey: 'exercises.leg_curl',         icon: '🌀', category: 'legs' },
  { id: 'leg_extension',    nameKey: 'exercises.leg_extension',    icon: '🦾', category: 'legs' },
  { id: 'calf_raise',       nameKey: 'exercises.calf_raise',       icon: '👣', category: 'legs' },
  { id: 'lunge',            nameKey: 'exercises.lunge',            icon: '🚶', category: 'legs' },
  { id: 'hack_squat',       nameKey: 'exercises.hack_squat',       icon: '⚙️', category: 'legs' },
  { id: 'front_squat',      nameKey: 'exercises.front_squat',      icon: '🏅', category: 'legs' },
  { id: 'glute_bridge',     nameKey: 'exercises.glute_bridge',     icon: '🍑', category: 'legs' },

  // Back
  { id: 'deadlift',         nameKey: 'exercises.deadlift',         icon: '⚡', category: 'back' },
  { id: 'barbell_row',      nameKey: 'exercises.barbell_row',      icon: '🔄', category: 'back' },
  { id: 'lat_pulldown',     nameKey: 'exercises.lat_pulldown',     icon: '⬇️', category: 'back' },
  { id: 'pull_up',          nameKey: 'exercises.pull_up',          icon: '🆙', category: 'back' },
  { id: 'cable_row',        nameKey: 'exercises.cable_row',        icon: '↔️', category: 'back' },
  { id: 't_bar_row',        nameKey: 'exercises.t_bar_row',        icon: '🔩', category: 'back' },
  { id: 'dumbbell_row',     nameKey: 'exercises.dumbbell_row',     icon: '🏃', category: 'back' },
  { id: 'hyperextension',   nameKey: 'exercises.hyperextension',   icon: '🌉', category: 'back' },
  { id: 'face_pull',        nameKey: 'exercises.face_pull',        icon: '🎯', category: 'back' },
  { id: 'straight_arm_pulldown', nameKey: 'exercises.straight_arm_pulldown', icon: '📡', category: 'back' },

  // Shoulders
  { id: 'overhead_press',   nameKey: 'exercises.overhead_press',   icon: '🙌', category: 'shoulders' },
  { id: 'lateral_raise',    nameKey: 'exercises.lateral_raise',    icon: '🕊️', category: 'shoulders' },
  { id: 'front_raise',      nameKey: 'exercises.front_raise',      icon: '⬆️', category: 'shoulders' },
  { id: 'rear_delt_fly',    nameKey: 'exercises.rear_delt_fly',    icon: '🦆', category: 'shoulders' },
  { id: 'arnold_press',     nameKey: 'exercises.arnold_press',     icon: '🤜', category: 'shoulders' },
  { id: 'shrug',            nameKey: 'exercises.shrug',            icon: '🤷', category: 'shoulders' },
  { id: 'upright_row',      nameKey: 'exercises.upright_row',      icon: '🪝', category: 'shoulders' },

  // Arms
  { id: 'bicep_curl',       nameKey: 'exercises.bicep_curl',       icon: '💪', category: 'arms' },
  { id: 'tricep_pushdown',  nameKey: 'exercises.tricep_pushdown',  icon: '📏', category: 'arms' },
  { id: 'hammer_curl',      nameKey: 'exercises.hammer_curl',      icon: '🔨', category: 'arms' },
  { id: 'preacher_curl',    nameKey: 'exercises.preacher_curl',    icon: '🪑', category: 'arms' },
  { id: 'skull_crusher',    nameKey: 'exercises.skull_crusher',    icon: '💀', category: 'arms' },
  { id: 'tricep_overhead',  nameKey: 'exercises.tricep_overhead',  icon: '🏹', category: 'arms' },
  { id: 'close_grip_bench', nameKey: 'exercises.close_grip_bench', icon: '🤝', category: 'arms' },
  { id: 'cable_curl',       nameKey: 'exercises.cable_curl',       icon: '🔌', category: 'arms' },

  // Core
  { id: 'plank',            nameKey: 'exercises.plank',            icon: '🪵', category: 'core' },
  { id: 'crunch',           nameKey: 'exercises.crunch',           icon: '🔁', category: 'core' },
  { id: 'leg_raise',        nameKey: 'exercises.leg_raise',        icon: '🦵', category: 'core' },
  { id: 'ab_wheel',         nameKey: 'exercises.ab_wheel',         icon: '🎡', category: 'core' },
  { id: 'russian_twist',    nameKey: 'exercises.russian_twist',    icon: '🌪️', category: 'core' },
  { id: 'cable_crunch',     nameKey: 'exercises.cable_crunch',     icon: '⚡', category: 'core' },
  { id: 'hanging_leg_raise',nameKey: 'exercises.hanging_leg_raise',icon: '🪢', category: 'core' },
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
