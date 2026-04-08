import { createClient } from '@/lib/supabase/client';
import type { Exercise, MuscleGroup } from '@/types';

export const CATEGORY_ORDER: Exercise['category'][] = [
  'chest',
  'legs',
  'back',
  'shoulders',
  'arms',
  'core',
];

type ExerciseRow = {
  id: string;
  name: string;
  icon: string;
  category: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  is_custom: boolean;
  user_id: string | null;
};

function mapRow(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    category: row.category as Exercise['category'],
    muscles: {
      primary: row.primary_muscles as MuscleGroup[],
      secondary: row.secondary_muscles as MuscleGroup[],
    },
    is_custom: row.is_custom,
    user_id: row.user_id,
  };
}

// Module-level cache — populated once per browser session
let _cache: Exercise[] | null = null;

export async function getExercises(): Promise<Exercise[]> {
  if (_cache) return _cache;
  const supabase = createClient();
  const { data } = await supabase
    .from('exercises')
    .select('id, name, icon, category, primary_muscles, secondary_muscles, is_custom, user_id')
    .order('sort_order');
  _cache = (data ?? []).map(mapRow);
  return _cache;
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const all = await getExercises();
  return all.find(e => e.id === id);
}
