"use client";

import { useMemo } from "react";
import { DesktopHeader } from "@/components/ui/TopNav";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { UserWithId } from "@/lib/types";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const leaderboardQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), orderBy("xp", "desc"), limit(50));
  }, [firestore]);

  const { data: players, isLoading } = useCollection<UserWithId>(leaderboardQuery);

  const rankedPlayers = players.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Leaderboard" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-center">
             <h2 className="text-2xl font-bold font-headline tracking-tight">Top Players</h2>
             <p className="text-sm text-white/50">See who's dominating the courts.</p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (
             <LeaderboardList players={rankedPlayers} />
          )}
        </div>
      </main>
    </div>
  );
}
