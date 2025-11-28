"use client";

import { useMemo, useState, useEffect } from "react";
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
  onSnapshot,
  orderBy,
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

  const [players, setPlayers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingPlayer, setEditingPlayer] = useState<UserWithId | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!firestore) return;
    const ref = collection(firestore, "users");
    const q = query(ref, orderBy("xp", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const v = d.data() as any;
        return {
          id: d.id,
          uid: d.id,
          ...v,
        };
      });
      setPlayers(rows);
      setLoading(false);
    });

    return () => unsub();
  }, [firestore]);


  function openModal(player: UserWithId) {
    setEditingPlayer(player);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPlayer(null);
  }

  function refresh(playerId: string) {
    logAdminAction(firestore, adminUser, 'update', 'player', playerId);
  }
  
  if (loading) {
    return (
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
                {[...Array(5)].map((_, i) => (
                  <TableRow key={`players-skeleton-${i}`}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </div>
      </div>
    );
  }


  return (
    <>
    <EditPlayerModal
        player={editingPlayer}
        open={modalOpen}
        onClose={closeModal}
        onUpdated={() => refresh(editingPlayer!.id)}
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
            {players && players.length > 0 ? (
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
                    <Button variant="outline" size="icon" onClick={() => openModal(player)}>
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