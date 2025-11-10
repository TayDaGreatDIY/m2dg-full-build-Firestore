
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

// Optional: tweak these to match your routes/icons
const NAV_ITEMS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/courts', label: 'Courts' },
  { href: '/missions', label: 'Missions' },
  { href: '/ai-trainer', label: 'AI Trainer' },
  { href: '/messages', label: 'DMs' },
  { href: '/notifications', label: 'Alerts' },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-2">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={[
              'rounded-md px-3 py-2 text-sm font-medium transition',
              active
                ? 'bg-white/10 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Sidebar renders:
 * - Desktop persistent sidebar (md+)
 * - Mobile Sheet (Radix Dialog under the hood) with hidden title/description
 *   to satisfy a11y: "DialogContent requires a DialogTitle..."
 */
export function Sidebar() {
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:gap-4 md:border-r md:border-white/10 md:bg-background/60 md:p-4">
        <div className="text-lg font-semibold text-white">🏀 M2DG</div>
        <NavLinks />
      </aside>

      {/* Mobile header + Sheet */}
      <div className="flex items-center justify-between md:hidden sticky top-0 bg-background/80 backdrop-blur-sm z-10 h-14 px-4 border-b border-white/10">
        <div className="text-lg font-semibold text-white">🏀 M2DG</div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger
            aria-label="Open navigation"
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>

          {/*
            IMPORTANT: The hidden header below satisfies Radix a11y
            without changing visuals. We also add aria-labelledby/aria-describedby
            to SheetContent so screen readers have a name/description.
          */}
          <SheetContent
            side="left"
            className="w-[280px] bg-background"
            aria-labelledby="mobile-nav-title"
            aria-describedby="mobile-nav-desc"
          >
            <SheetHeader className="sr-only">
              <SheetTitle id="mobile-nav-title">Main Navigation</SheetTitle>
              <SheetDescription id="mobile-nav-desc">
                Sidebar with links to the main sections of the app.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4">
              <NavLinks onNavigate={() => setIsSheetOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export default Sidebar;
