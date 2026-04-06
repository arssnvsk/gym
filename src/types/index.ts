export type MuscleGroup =
  | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts'
  | 'biceps' | 'triceps' | 'forearms'
  | 'upper_back' | 'lats' | 'lower_back'
  | 'abs' | 'obliques'
  | 'glutes' | 'quads' | 'hamstrings' | 'calves';

export interface Exercise {
  id: string;
  nameKey: string; // i18n key
  icon: string;
  category: 'chest' | 'legs' | 'back' | 'shoulders' | 'arms' | 'core';
  muscles: { primary: MuscleGroup[]; secondary: MuscleGroup[] };
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  created_at: string;
  client_profile_id?: string | null;
}

export interface SetInput {
  exercise_id: string;
  reps: number;
  weight: number;
}

export interface ChartPoint {
  date: string;
  value: number;
}

export interface ClientProfile {
  id: string;
  user_id: string; // trainer
  name: string;
  is_active: boolean;
  created_at: string;
}
