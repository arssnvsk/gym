import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientsClient from './ClientsClient';

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <ClientsClient userId={user.id} />;
}
