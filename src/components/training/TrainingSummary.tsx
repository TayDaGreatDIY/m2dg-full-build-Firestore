
"use client";

import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainingSummary() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4">
      <div>
        <p className="text-sm uppercase text-white/50">Training Streak</p>
        <p className="text-4xl font-extrabold text-orange font-headline">{user.trainingStreak} <span className="text-2xl text-white/80">days</span></p>
      </div>
      <div>
        <p className="text-sm uppercase text-white/50">Last Session</p>
        <p className="font-semibold text-white/90">Yesterday @ The Cage</p> 
      </div>
       <div className="bg-orange/10 border border-orange/20 rounded-md p-3 text-center">
            <p className="text-sm text-orange/90">Your grind earns XP. Stay locked in.</p>
       </div>
    </div>
  );
}
