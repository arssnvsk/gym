import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import PWAProvider from '@/components/PWAProvider';
import OfflineBanner from '@/components/OfflineBanner';
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
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/api/icons/180" />
      </head>
      <body className={`${geist.variable} antialiased min-h-screen bg-[#0A0A0A]`}>
        <NextIntlClientProvider messages={messages}>
          <PWAProvider />
          <OfflineBanner />
          <div className="max-w-[480px] mx-auto min-h-screen">
            {children}
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
