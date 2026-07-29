import type { Metadata } from 'next';
import { Inter, Sora, Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import { ApolloClientProvider } from '@/components/providers/apollo-provider';
import { TfThemeProvider } from '@/components/tf/theme';
import { GlassSettings } from '@/components/tf/GlassSettings';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Gestionnaire de projets collaboratif',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body
        className={`${jakarta.variable} ${inter.variable} ${sora.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloClientProvider>
          <TfThemeProvider>
            {children}
            <GlassSettings />
          </TfThemeProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
