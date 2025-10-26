"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import TopNav from "@/components/ui/TopNav";
import UserAvatar from "@/components/ui/UserAvatar";
import StatTile from "@/components/ui/StatTile";
import SectionCard from "@/components/ui/SectionCard";
import { MapPin, Dumbbell, Trophy, MessageSquare, ShieldCheck } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthUser();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Dashboard" />
        
        <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar src={user.photoURL} name={user.displayName} size={48} />
            <div>
              <h2 className="text-lg font-bold font-headline">Welcome, {user.displayName}</h2>
              <p className="text-sm text-white/50">@{user.username}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatTile label="XP Points" value={user.xp} />
          <StatTile label="Training Streak" value={`${user.trainingStreak}d`} />
          <StatTile label="Win Streak" value={`${user.winStreak}W`} />
          <StatTile label="Home Court" value={user.homeCourt} />
        </div>

        <div className="space-y-4">
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
