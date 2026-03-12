import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getExerciseById } from '@/lib/exercises';
import ExerciseClient from './ExerciseClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;

  const exercise = getExerciseById(id);
  if (!exercise) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return <ExerciseClient exercise={exercise} userId={user.id} />;
}
