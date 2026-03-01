import type {Metadata, Viewport} from 'next';
import './globals.css'; // Global styles
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AppLayout } from '@/components/AppLayout';
import Providers from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Nexus SCADA Dashboard',
  description: 'A comprehensive manufacturing, SCADA, and production management dashboard.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body suppressHydrationWarning className="font-sans antialiased text-slate-900">
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
