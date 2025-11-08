
"use client";

import { useMemo, useState, useEffect } from "react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import type { User, UserRole } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useUser as useAuthUser } from "@/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Loader2, User as UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "../ui/UserAvatar";

const playerSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  xp: z.coerce.number().min(0, "XP cannot be negative"),
  winStreak: z.coerce.number().min(0, "Win streak cannot be negative"),
  role: z.enum(["player", "coach", "moderator", "admin"]),
  status: z.enum(["active", "suspended"]),
});

async function logAdminAction(firestore: any, user: any, action: string, targetType: string, targetId: string) {
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
  const { user: adminUser } = useAuthUser();

  const usersQuery = useMemoFirebase(() => collection(firestore, 'users'), [firestore]);
  const { data: players, isLoading } = useCollection<User>(usersQuery);
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold font-headline">Manage Players</h2>
            <p className="text-white/60 text-sm">Edit user roles, stats, and status.</p>
        </div>
      </div>

      <div className="bg-card border border-white/10 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>XP</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={`player-skeleton-${i}`}>
                  <TableCell><div className="flex items-center gap-2"><Skeleton className="h-8 w-8 rounded-full" /><Skeleton className="h-5 w-32" /></div></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-10 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : players && players.length > 0 ? (
              players.map((player) => (
                <TableRow key={player.uid}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                        <UserAvatar src={player.avatarURL} name={player.displayName} size={32} />
                        <div>
                            <p className="font-bold">{player.displayName}</p>
                            <p className="text-xs text-white/50">@{player.username}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>{player.xp}</TableCell>
                  <TableCell><Badge variant="outline">{player.role || 'player'}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={player.status === 'active' ? 'secondary' : 'destructive'}>{player.status || 'active'}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PlayerFormDialog
                        player={player}
                        trigger={<Button variant="outline" size="icon"><Edit size={16} /></Button>}
                        onFormSubmit={(action, playerId) => logAdminAction(firestore, adminUser, action, 'player', playerId)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">No players found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PlayerFormDialog({ trigger, player, onFormSubmit }: { trigger: React.ReactNode, player: User, onFormSubmit: (action: string, playerId: string) => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof playerSchema>>({
      resolver: zodResolver(playerSchema),
      defaultValues: {
          ...player,
          role: player.role || 'player',
          status: player.status || 'active'
      },
    });

    useEffect(() => {
        if(isOpen) {
            form.reset({
                ...player,
                role: player.role || 'player',
                status: player.status || 'active',
            });
        }
    }, [isOpen, player, form]);
    
    const onSubmit = async (values: z.infer<typeof playerSchema>) => {
      setIsSubmitting(true);
      try {
        const playerRef = doc(firestore, "users", player.uid);
        await updateDoc(playerRef, values);
        toast({ title: "Player Updated!", description: `${values.displayName}'s profile has been updated.` });
        onFormSubmit('update_player', player.uid);
        setIsOpen(false);
      } catch (error) {
        console.error("Error saving player:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not save player profile." });
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>Edit Player: @{player.username}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                            <FormField control={form.control} name="displayName" render={({ field }) => (
                                <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="xp" render={({ field }) => (
                                    <FormItem><FormLabel>XP</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="winStreak" render={({ field }) => (
                                    <FormItem><FormLabel>Win Streak</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                            </div>
                            <FormField control={form.control} name="role" render={({ field }) => (
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
                            )}/>
                             <FormField control={form.control} name="status" render={({ field }) => (
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
                            )}/>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                 </Form>
            </DialogContent>
        </Dialog>
    );
}
