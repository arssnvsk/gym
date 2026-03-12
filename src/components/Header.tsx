'use client';

import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = user.email?.slice(0, 2).toUpperCase() ?? 'U';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#1F1F1F]">
      <h1 className="text-lg font-bold text-white">{t('app.title')}</h1>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={initials}
            className="w-8 h-8 rounded-full object-cover border border-[#FF5722]/40"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#FF5722] flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="text-xs text-[#888] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#1F1F1F]"
        >
          {t('auth.signOut')}
        </button>
      </div>
    </header>
  );
}
