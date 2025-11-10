
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Newspaper, Map, Trophy, MessageSquare, ShieldCheck, Bell, ShoppingBag, BrainCircuit, Bot, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserNotificationsCount } from "@/hooks/useUserNotifications";

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/courts", icon: Map, label: "Courts" },
  { href: "/missions", icon: Target, label: "Missions" },
  { href: "/ai-trainer", icon: Bot, label: "AI Coach" },
  { href: "/messages", icon: MessageSquare, label: "DMs" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const unreadCount = useUserNotificationsCount();

  if (pathname === '/login' || pathname.startsWith('/messages/') || pathname.startsWith('/admin')) {
      return null;
  }


  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(60px+env(safe-area-inset-bottom))] bg-[var(--color-bg-card)] border-t border-white/10 md:hidden">
      <div className="max-w-md mx-auto h-full flex justify-around items-start pt-2 px-2 text-white/60">
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
         <Link href="/notifications" className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors relative",
                  pathname === "/notifications" ? "text-orange font-semibold" : "hover:text-white"
                )}
              >
                <Bell size={22} strokeWidth={pathname === "/notifications" ? 2.5 : 2} />
                 {unreadCount > 0 && (
                    <div className="absolute top-0 right-3.5 h-4 w-4 bg-orange rounded-full text-black text-[10px] flex items-center justify-center font-bold">
                        {unreadCount}
                    </div>
                )}
                <span className="text-[10px]">Alerts</span>
              </div>
            </Link>
      </div>
    </nav>
  );
}
