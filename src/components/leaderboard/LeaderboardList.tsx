
"use client";

import type { User } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

type LeaderboardPlayer = User & { rank: number };

type LeaderboardListProps = {
  players: LeaderboardPlayer[];
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "text-gold";
    case 2:
      return "text-slate-300";
    case 3:
      return "text-amber-600";
    default:
      return "text-white/40";
  }
};

export default function LeaderboardList({ players }: LeaderboardListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.uid} className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-3 flex items-center gap-4">
          <div className={cn("text-2xl font-bold w-8 text-center", getRankColor(player.rank))}>
            {player.rank}
          </div>
          <UserAvatar src={player.avatarURL} name={player.displayName} size={40} />
          <div className="flex-1">
             <Link href={`/player/${player.uid}`} className="hover:underline">
                <p className="font-bold text-sm">{player.displayName}</p>
                <p className="text-xs text-white/50">@{player.username} • {player.homeCourt}</p>
             </Link>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs">{player.xp} XP</Badge>
            {player.trainingStreak > 0 && <Badge variant="outline" className="text-xs text-orange border-orange/50">{player.trainingStreak}D STREAK</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}
