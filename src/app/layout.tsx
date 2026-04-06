import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import PWAProvider from '@/components/PWAProvider';
import OfflineBanner from '@/components/OfflineBanner';
import ThemeProvider from '@/components/ThemeProvider';
import { getServerPreferences } from '@/lib/preferences.server';
import './globals.css';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Тренировки',
  description: 'Следи за прогрессом в тренажёрном зале',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Тренировки',
  },
};

export const viewport: Viewport = {
  themeColor: '#FF5722',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, messages, prefs] = await Promise.all([
    getLocale(),
    getMessages(),
    getServerPreferences(),
  ]);

  const { theme } = prefs;

  // Inline blocking script: applies theme class before first paint.
  // The theme value is injected server-side so it works on any device
  // without reading localStorage first.
  const themeScript = `(function(){var t=${JSON.stringify(theme)};if(t==='light'||(t==='system'&&!window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('light');}try{localStorage.setItem('gym-theme',t);}catch(e){}})();`;

  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/api/icons/180" />
        {/* Blocking: runs before CSS/React, eliminates theme flash on any device */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${geist.variable} antialiased min-h-screen bg-[var(--t-bg)]`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider initialTheme={theme}>
            <PWAProvider />
            <OfflineBanner />
            <div className="max-w-[480px] mx-auto min-h-screen">
              {children}
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
