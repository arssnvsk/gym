import { notFound } from 'next/navigation';
import { getExerciseByIdServer } from '@/lib/exercises.server';
import ExerciseClient from './ExerciseClient';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ExercisePage({ params }: Props) {
  const { id } = await params;

  const exercise = await getExerciseByIdServer(id);
  if (!exercise) notFound();

  return <ExerciseClient exercise={exercise} />;
}
