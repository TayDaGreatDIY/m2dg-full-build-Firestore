import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import BottomNav from '@/components/ui/BottomNav';
import { Home, Map, ShieldCheck, Trophy, MessageSquare, Bell, ShoppingBag, BrainCircuit, Bot, Shield, Target, Menu } from 'lucide-react';
import AdminSidebarMenu from '@/components/ui/AdminSidebarMenu';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'M2DG - Married 2 Da\' Game',
  description: 'United by passion. Energized by the grind.',
};

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/courts", icon: Map, label: "Courts" },
  { href: "/missions", icon: Target, label: "Missions" },
  { href: "/challenges", icon: ShieldCheck, label: "Challenges" },
  { href: "/leaderboard", icon: Trophy, label: "Leaders" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/locker-room", icon: ShoppingBag, label: "Locker Room"},
  { href: "/motivational-mindset", icon: BrainCircuit, label: "Motivation" },
  { href: "/ai-trainer", icon: Bot, label: "AI Trainer" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
];

function NavLinks() {
  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
       <AdminSidebarMenu />
    </nav>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[var(--color-bg-main)] text-[var(--color-text-main)] antialiased min-h-screen flex flex-col font-body" suppressHydrationWarning>
        <FirebaseClientProvider>
          <div className="md:flex">
             {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:w-64 md:flex-col md:gap-4 md:border-r md:border-white/10 md:bg-background/80 md:p-4">
              <div className="text-gold font-extrabold text-xl font-headline p-2">🏀 M2DG</div>
              <NavLinks />
            </aside>

            <div className="flex-1">
              {/* Mobile Header */}
              <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-background/80 px-4 backdrop-blur-sm md:hidden">
                <Link href="/dashboard" className="text-gold font-extrabold text-xl font-headline">🏀 M2DG</Link>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Open Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px] bg-background p-4">
                     <SheetHeader className="sr-only">
                        <SheetTitle>Main Navigation</SheetTitle>
                        <SheetDescription>Sidebar with links to the main sections of the app.</SheetDescription>
                    </SheetHeader>
                    <div className="text-gold font-extrabold text-xl font-headline p-2 mb-4">🏀 M2DG</div>
                    <NavLinks />
                  </SheetContent>
                </Sheet>
              </header>
              <main className="flex-1 flex flex-col">
                {children}
              </main>
            </div>
          </div>
          <BottomNav />
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
