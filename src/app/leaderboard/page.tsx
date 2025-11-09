
"use client";

import { useMemo } from "react";
import { collection, query, orderBy, type Query } from "firebase/firestore";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { User as AppUser } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import LeaderboardList from "@/components/leaderboard/LeaderboardList";
import { DesktopHeader } from "@/components/ui/TopNav";
import { Loader2 } from "lucide-react";

type LeaderboardPlayer = AppUser & { rank: number };

export default function LeaderboardPage() {
  const firestore = useFirestore();

  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"), orderBy("xp", "desc")) as Query<AppUser>;
  }, [firestore]);

  const { data: players, isLoading } = useCollection<AppUser>(leaderboardQuery);

  const rankedPlayers: LeaderboardPlayer[] = useMemo(() => {
    return players?.map((player, index) => ({
      ...player,
      rank: index + 1,
    })) ?? [];
  }, [players]);

  return (
    <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Leaderboard" />
        <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
            <div className="max-w-md mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold font-headline tracking-tight">Top Players</h2>
                    <p className="text-sm text-white/50">See who's dominating the courts this week.</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center pt-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <LeaderboardList players={rankedPlayers} />
                )}
            </div>
        </main>
    </div>
  );
}
