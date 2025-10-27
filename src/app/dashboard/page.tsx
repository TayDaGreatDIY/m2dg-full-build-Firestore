
"use client";

import { useUser, useDoc, useMemoFirebase } from "@/firebase";
import { DesktopHeader } from "@/components/ui/TopNav";
import UserAvatar from "@/components/ui/UserAvatar";
import StatTile from "@/components/ui/StatTile";
import SectionCard from "@/components/ui/SectionCard";
import { MapPin, Dumbbell, Trophy, MessageSquare, ShieldCheck, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { User as AppUser } from "@/lib/types";
import Link from "next/link";


export default function DashboardPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);

  const loading = isUserLoading || isUserDocLoading;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
         <DesktopHeader pageTitle="Dashboard" />
        <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <p>Could not load user profile.</p>
       </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
       <DesktopHeader pageTitle="Dashboard" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        
        <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4 max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <UserAvatar src={user.avatarURL} name={user.displayName} size={48} />
            <div>
              <h2 className="text-lg font-bold font-headline">Welcome, {user.displayName}</h2>
              <Link href={`/player/${user.uid}`} className="hover:underline">
                <p className="text-sm text-white/50">@{user.username}</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <StatTile label="XP Points" value={user.xp} />
          <StatTile label="Training Streak" value={`${user.trainingStreak}d`} />
          <StatTile label="Win Streak" value={`${user.winStreak}W`} />
          <StatTile label="Home Court" value={user.homeCourt} />
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white/90 font-headline tracking-tight px-1">Quick Actions</h3>
          <div className="space-y-2">
            <SectionCard title="Training Hub" desc="Log your grind, earn XP" href="/training" icon={Dumbbell} />
            <SectionCard title="Find a Court" desc="Discover local runs" href="/courts" icon={MapPin} />
            <SectionCard title="Challenges" desc="Weekly missions and goals" href="/challenges" icon={ShieldCheck} />
            <SectionCard title="Leaderboard" desc="See who's on top" href="/leaderboard" icon={Trophy} />
            <SectionCard title="Messages" desc="Connect with the community" href="/messages" icon={MessageSquare} />
          </div>
        </div>

      </main>
    </div>
  );
}
