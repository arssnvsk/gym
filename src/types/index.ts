export type MuscleGroup =
  | 'chest' | 'front_delts' | 'side_delts' | 'rear_delts'
  | 'biceps' | 'triceps' | 'forearms'
  | 'upper_back' | 'lats' | 'lower_back'
  | 'abs' | 'obliques'
  | 'glutes' | 'quads' | 'hamstrings' | 'calves';

export interface Exercise {
  id: string;
  name: string;
  icon: string;
  category: 'chest' | 'legs' | 'back' | 'shoulders' | 'arms' | 'core';
  muscles: { primary: MuscleGroup[]; secondary: MuscleGroup[] };
  is_custom: boolean;
  user_id: string | null;
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

export interface ClientSession {
  id: string;
  user_id: string;
  client_profile_id: string;
  scheduled_at: string; // ISO 8601, stored as UTC
  notes: string | null;
  created_at: string;
}
