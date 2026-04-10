import { notFound } from 'next/navigation';
import { getExerciseById, EXERCISES } from '@/lib/exercises';
import { getServerPreferences } from '@/lib/preferences.server';
import ExerciseClient from './ExerciseClient';

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ id: e.id }));
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;

  const exercise = getExerciseById(id);
  if (!exercise) notFound();

  const { showNextSetRec } = await getServerPreferences();

  return <ExerciseClient exercise={exercise} showNextSetRec={showNextSetRec} />;
}
