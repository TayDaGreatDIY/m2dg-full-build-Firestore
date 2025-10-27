
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import BottomNav from '@/components/ui/BottomNav';
import { Home, Map, ShieldCheck, Trophy, MessageSquare, Bell, ShoppingBag, BrainCircuit } from 'lucide-react';

export const metadata: Metadata = {
  title: 'M2DG - Married 2 Da\' Game',
  description: 'United by passion. Energized by the grind.',
};

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/courts", icon: Map, label: "Courts" },
  { href: "/challenges", icon: ShieldCheck, label: "Missions" },
  { href: "/leaderboard", icon: Trophy, label: "Leaders" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
  { href: "/locker-room", icon: ShoppingBag, label: "Locker Room"},
  { href: "/motivational-mindset", icon: BrainCircuit, label: "Motivation" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
];

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
          <SidebarProvider>
            <Sidebar>
              <SidebarContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div className="text-gold font-extrabold text-xl font-headline p-2">🏀 M2DG</div>
                  </SidebarMenuItem>
                  {navItems.map((item) => (
                     <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton href={item.href} left={<item.icon />}>{item.label}</SidebarMenuButton>
                     </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <div className="flex-1 flex flex-col">
                  {children}
                </div>
                <BottomNav />
                <Toaster />
            </SidebarInset>
          </SidebarProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
