
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { UserWithId } from "@/lib/types";

interface EditPlayerModalProps {
  open: boolean;
  player: UserWithId | null;
  onClose: () => void;
  onUpdated: () => void; // callback for parent to refresh
}

export default function EditPlayerModal({
  open,
  player,
  onClose,
  onUpdated,
}: EditPlayerModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [xp, setXp] = useState(0);
  const [role, setRole] = useState("player");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  // load player data into form state when the modal is opened or player changes
  useEffect(() => {
    if (player) {
      setDisplayName(player.displayName ?? "");
      setUsername(player.username ?? "");
      setXp(player.xp ?? 0);
      setRole(player.role ?? "player");
      setStatus(player.status ?? "active");
    }
  }, [player, open]);

  if (!open || !player) return null;

  async function save() {
    if (!firestore) {
        toast({variant: "destructive", title: "Database connection lost."})
        return;
    };

    setLoading(true);
    try {
      const ref = doc(firestore, "users", player.id);

      await updateDoc(ref, {
        displayName,
        username,
        xp: Number(xp),
        role,
        status,
        updatedAt: serverTimestamp(),
      });
      
      toast({title: "Player Updated", description: `${displayName}'s profile has been saved.`});

      onUpdated();
      onClose();
    } catch (err) {
      console.error("Failed to update player:", err);
      toast({variant: "destructive", title: "Update Failed", description: "Could not save player changes."});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-card rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl border border-white/10 text-white">
        <h2 className="text-xl font-bold font-headline">Edit: {player.displayName}</h2>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Display Name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Username</label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">XP</label>
                <Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-base">
                    <option value="player">Player</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                </select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-base">
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                </select>
            </div>
        </div>


        <div className="flex gap-2 pt-3">
          <Button className="w-full" disabled={loading} onClick={save}>
            {loading ? <Loader2 className="animate-spin" /> : "Save Changes"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
