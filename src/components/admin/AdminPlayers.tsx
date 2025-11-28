
"use client";

import { useMemo, useState } from "react";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser as useAdminUser,
} from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import type { UserWithId } from "@/lib/types";
import EditPlayerModal from "@/components/admin/EditPlayerModal";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/ui/UserAvatar";

// ---------------- Admin Log Function ----------------

async function logAdminAction(
  firestore: any,
  user: any,
  action: string,
  targetType: string,
  targetId: string
) {
  if (!firestore || !user) return;
  try {
    await addDoc(collection(firestore, "admin_logs"), {
      action,
      targetType,
      targetId,
      performedBy: user.email,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}

// ---------------- Main Component ----------------

export default function AdminPlayers() {
  const firestore = useFirestore();
  const { user: adminUser } = useAdminUser();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<UserWithId | null>(null);
  
  // A simple way to trigger a re-fetch or re-render in child components if needed
  const [updateCounter, setUpdateCounter] = useState(0);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "users"));
  }, [firestore, updateCounter]);

  const { data: players, isLoading } = useCollection<UserWithId>(usersQuery);

  const handleEditClick = (player: UserWithId) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };
  
  const handlePlayerUpdated = (playerId: string) => {
      logAdminAction(firestore, adminUser, 'update', 'player', playerId);
      // Increment counter to force a re-render/re-fetch of the user list if necessary
      setUpdateCounter(prev => prev + 1);
  }


  return (
    <>
    <EditPlayerModal
        player={selectedPlayer}
        open={isModalOpen}
        onClose={handleCloseModal}
        onUpdated={() => handlePlayerUpdated(selectedPlayer!.id)}
    />
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-headline">Manage Players</h2>
          <p className="text-white/60 text-sm">
            Edit player roles, status, and stats.
          </p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`players-skeleton-${i}`}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : players && players.length > 0 ? (
              players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={player.avatarURL}
                        name={player.displayName}
                        size={32}
                      />
                      <div>
                        <p>{player.displayName}</p>
                        <p className="text-xs text-white/50">
                          @{player.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>{player.email}</TableCell>

                  <TableCell>
                    <Badge
                      variant={player.role === "admin" ? "gold" : "secondary"}
                    >
                      {player.role || "player"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        player.status === "active"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {player.status || "active"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => handleEditClick(player)}>
                        <Edit size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center h-24 text-white/60"
                >
                  No players found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  );
}
