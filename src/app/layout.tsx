
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import BottomNav from '@/components/ui/BottomNav';
import { AuthProvider } from '@/hooks/useAuth';

export const metadata: Metadata = {
  title: 'M2DG - Married 2 Da\' Game',
  description: 'United by passion. Energized by the grind.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[var(--color-bg-main)] text-[var(--color-text-main)] antialiased min-h-screen flex flex-col font-body">
        <AuthProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <BottomNav />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
