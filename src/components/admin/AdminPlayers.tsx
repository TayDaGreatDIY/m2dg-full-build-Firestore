
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
  updateDoc,
  doc,
  serverTimestamp,
  query,
} from "firebase/firestore";
import type { User, UserWithId } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/ui/UserAvatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const playerSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  username: z.string().min(2, "Username is required"),
  email: z.string().email("Invalid email address"),
  role: z
    .enum(["player", "coach", "moderator", "admin"])
    .default("player"),
  status: z.enum(["active", "suspended"]).default("active"),
  xp: z.coerce.number().min(0),
  trainingStreak: z.coerce.number().min(0),
  winStreak: z.coerce.number().min(0),
});

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

export default function AdminPlayers() {
  const firestore = useFirestore();
  const { user: adminUser } = useAdminUser();
  const usersQuery = useMemoFirebase(
    () => query(collection(firestore, "users")),
    [firestore]
  );
  
  const { data: players, isLoading } = useCollection<UserWithId>(usersQuery);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold font-headline">
            Manage Players
          </h2>
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
                  <TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell>
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
                      variant={
                        player.role === "admin" ? "gold" : "secondary"
                      }
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
                    <PlayerEditDialog
                      player={player}
                      trigger={
                        <Button variant="outline" size="icon">
                          <Edit size={16} />
                        </Button>
                      }
                      onFormSubmit={(action, id) =>
                        logAdminAction(
                          firestore,
                          adminUser,
                          action,
                          "player",
                          id
                        )
                      }
                    />
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
  );
}

function PlayerEditDialog({
  trigger,
  player,
  onFormSubmit,
}: {
  trigger: React.ReactNode;
  player: UserWithId;
  onFormSubmit: (action: string, id: string) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof playerSchema>>({
    resolver: zodResolver(playerSchema),
  });

  useEffect(() => {
    if (isOpen && player) {
      form.reset({
        ...player,
        role: player.role || "player",
        status: player.status || "active",
      });
    }
  }, [isOpen, player, form]);

  const onSubmit = async (values: z.infer<typeof playerSchema>) => {
    setIsSubmitting(true);
    try {
      const playerRef = doc(firestore, "users", player.id);
      await updateDoc(playerRef, values);
      toast({
        title: "Player Updated!",
        description: `${values.displayName}'s profile has been updated.`,
      });
      onFormSubmit("update", player.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update player profile.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-white/10">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <DialogHeader>
                <DialogTitle>Edit Player: {player.displayName}</DialogTitle>
                <VisuallyHidden><DialogDescription>Update player details below.</DialogDescription></VisuallyHidden>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              <FormField control={form.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="xp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>XP</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="trainingStreak" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Streak</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="winStreak" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Win Streak</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="coach">Coach</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

