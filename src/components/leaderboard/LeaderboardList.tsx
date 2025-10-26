"use client";

import type { LeaderboardEntry } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type LeaderboardListProps = {
  players: LeaderboardEntry[];
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
        <div key={player.rank} className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-3 flex items-center gap-4">
          <div className={cn("text-2xl font-bold w-8 text-center", getRankColor(player.rank))}>
            {player.rank}
          </div>
          <UserAvatar src={player.avatar} name={player.name} size={40} />
          <div className="flex-1">
            <p className="font-bold text-sm">{player.name}</p>
            <p className="text-xs text-white/50">@{player.username} • {player.city}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs">{player.xp} XP</Badge>
            {player.streak > 0 && <Badge variant="outline" className="text-xs text-orange border-orange/50">{player.streak}D STREAK</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
}
