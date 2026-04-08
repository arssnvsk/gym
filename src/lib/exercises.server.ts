import { createClient } from '@/lib/supabase/server';
import type { Exercise, MuscleGroup } from '@/types';

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

export async function getExercisesServer(): Promise<Exercise[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exercises')
      .select('id, name, icon, category, primary_muscles, secondary_muscles, is_custom, user_id')
      .order('sort_order');
    return (data ?? []).map(mapRow);
  } catch {
    return [];
  }
}

export async function getExerciseByIdServer(id: string): Promise<Exercise | undefined> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('exercises')
      .select('id, name, icon, category, primary_muscles, secondary_muscles, is_custom, user_id')
      .eq('id', id)
      .single();
    return data ? mapRow(data) : undefined;
  } catch {
    return undefined;
  }
}
