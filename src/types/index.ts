export interface Exercise {
  id: string;
  nameKey: string; // i18n key
  icon: string;
  category: 'chest' | 'legs' | 'back' | 'shoulders' | 'arms';
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  exercise_id: string;
  reps: number;
  weight: number;
  created_at: string;
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
