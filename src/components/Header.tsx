'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User | null;
}

function BurgerIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden>
      <rect x="0" y="0"  width="18" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="6"  width="18" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="12" width="18" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function Header({ user }: HeaderProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function navigate(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '..';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-[#1F1F1F]">
      <div className="flex items-center gap-2">
        {/* Burger menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
              menuOpen ? 'bg-white/10 text-white' : 'text-[#888] hover:text-white hover:bg-white/5'
            }`}
            aria-label="Меню"
          >
            <BurgerIcon />
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-xl overflow-hidden z-50">
              <button
                onClick={() => navigate('/day')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <span className="text-lg leading-none">📊</span>
                <span className="font-medium">Отчёт</span>
              </button>
              <div className="h-px bg-[#2A2A2A]" />
              <button
                onClick={() => navigate('/insights')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <span className="text-lg leading-none">💡</span>
                <span className="font-medium">Советы</span>
              </button>
              {user && (
                <>
                  <div className="h-px bg-[#2A2A2A]" />
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-[#888] hover:text-white hover:bg-white/5 active:bg-white/10 transition-colors"
                  >
                    <span className="text-lg leading-none">🚪</span>
                    <span>{t('auth.signOut')}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      <h1 className="text-lg font-bold text-white">{t('app.title')}</h1>

      {/* Avatar */}
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
    </header>
  );
}
