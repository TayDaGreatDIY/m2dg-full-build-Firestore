"use client";

import TopNav from "@/components/ui/TopNav";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import { demoLeaderboard } from "@/lib/demoData";

export default function LeaderboardPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Leaderboard" />
        
        <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Top Ballers</h2>
            <p className="text-sm text-white/50">Top hoopers. Real grind. Updated live soon.</p>
        </div>

        <LeaderboardList players={demoLeaderboard} />
      </main>
    </div>
  );
}
