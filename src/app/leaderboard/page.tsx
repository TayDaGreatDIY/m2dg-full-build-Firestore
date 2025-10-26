
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import { useCollection, useMemoFirebase } from "@/firebase";
import type { User } from "@/lib/types";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), orderBy("xp", "desc"), limit(10));
  }, [firestore]);
  
  const { data: players, isLoading } = useCollection<User>(leaderboardQuery);

  const rankedPlayers = players ? players.map((player, index) => ({
    ...player,
    rank: index + 1,
  })) : [];

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Leaderboard" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold font-headline tracking-tight">Top Ballers</h2>
                <p className="text-sm text-white/50">Top hoopers. Real grind. Updated live.</p>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <LeaderboardList players={rankedPlayers} />
            )}
        </div>
      </main>
    </div>
  );
}
