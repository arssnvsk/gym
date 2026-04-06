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
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-[var(--t-bg-alpha)] backdrop-blur-md border-b border-[var(--t-border)]">
      <div className="flex items-center gap-2">
        {/* Burger menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
              menuOpen
                ? 'bg-[var(--t-overlay-md)] text-[var(--t-text)]'
                : 'text-[var(--t-muted)] hover:text-[var(--t-text)] hover:bg-[var(--t-overlay)]'
            }`}
            aria-label="Меню"
          >
            <BurgerIcon />
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-[var(--t-hover)] border border-[var(--t-border2)] rounded-2xl shadow-xl overflow-hidden z-50">
              <button
                onClick={() => navigate('/day')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-[var(--t-text)] hover:bg-[var(--t-overlay)] active:bg-[var(--t-overlay-md)] transition-colors"
              >
                <span className="text-lg leading-none">📊</span>
                <span className="font-medium">Отчёт</span>
              </button>
              <div className="h-px bg-[var(--t-border2)]" />
              <button
                onClick={() => navigate('/insights')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-[var(--t-text)] hover:bg-[var(--t-overlay)] active:bg-[var(--t-overlay-md)] transition-colors"
              >
                <span className="text-lg leading-none">💡</span>
                <span className="font-medium">Советы</span>
              </button>
              <div className="h-px bg-[var(--t-border2)]" />
              <button
                onClick={() => navigate('/settings')}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-[var(--t-text)] hover:bg-[var(--t-overlay)] active:bg-[var(--t-overlay-md)] transition-colors"
              >
                <span className="text-lg leading-none">⚙️</span>
                <span className="font-medium">Настройки</span>
              </button>
              {user && (
                <>
                  <div className="h-px bg-[var(--t-border2)]" />
                  <button
                    onClick={() => { setMenuOpen(false); handleSignOut(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-[var(--t-muted)] hover:text-[var(--t-text)] hover:bg-[var(--t-overlay)] active:bg-[var(--t-overlay-md)] transition-colors"
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

      <h1 className="text-lg font-bold text-[var(--t-text)]">{t('app.title')}</h1>

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
