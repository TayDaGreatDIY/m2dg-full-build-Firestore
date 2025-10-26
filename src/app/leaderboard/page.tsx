
"use client";

import TopNav from "@/components/ui/TopNav";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import { useCollection } from "@/hooks/useCollection";
import type { User } from "@/lib/types";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardPage() {
  const leaderboardQuery = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
  const { data: players, loading } = useCollection<User>('users', leaderboardQuery);

  const rankedPlayers = players.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Leaderboard" />
        
        <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Top Ballers</h2>
            <p className="text-sm text-white/50">Top hoopers. Real grind. Updated live.</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <LeaderboardList players={rankedPlayers} />
        )}
      </main>
    </div>
  );
}
