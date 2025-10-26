"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Map, Trophy, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/feed", icon: Newspaper, label: "Feed" },
  { href: "/courts", icon: Map, label: "Courts" },
  { href: "/leaderboard", icon: Trophy, label: "Leaders" },
  { href: "/messages", icon: MessageSquare, label: "Messages" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(60px+env(safe-area-inset-bottom))] bg-[var(--color-bg-card)] border-t border-white/10 md:hidden">
      <div className="max-w-md mx-auto h-full flex justify-between items-start pt-2 px-4 text-white/60">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
          return (
            <Link href={item.href} key={item.label} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  isActive ? "text-orange font-semibold" : "hover:text-white"
                )}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px]">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
