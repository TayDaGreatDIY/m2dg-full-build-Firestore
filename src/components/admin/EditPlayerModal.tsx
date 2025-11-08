
"use client";

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import type { UserWithId } from "@/lib/types";
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
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Loader2 } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// ---------------- Schema ----------------

const playerSchema = z.object({
  displayName: z.string().min(2, "Display name is required"),
  username: z.string().min(2, "Username is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["player", "coach", "moderator", "admin"]),
  status: z.enum(["active", "suspended"]),
  xp: z.coerce.number().min(0),
  trainingStreak: z.coerce.number().min(0),
  winStreak: z.coerce.number().min(0),
});

// ---------------- Player Edit Dialog ----------------

interface EditPlayerModalProps {
    player: UserWithId;
    isOpen: boolean;
    onClose: () => void;
    onFormSubmit: (action: string, id: string) => void;
}

export default function EditPlayerModal({
  player,
  isOpen,
  onClose,
  onFormSubmit,
}: EditPlayerModalProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof playerSchema>>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      displayName: player?.displayName ?? "",
      username: player?.username ?? "",
      email: player?.email ?? "",
      role: player?.role ?? "player",
      status: player?.status ?? "active",
      xp: player?.xp ?? 0,
      trainingStreak: player?.trainingStreak ?? 0,
      winStreak: player?.winStreak ?? 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof playerSchema>) => {
    setIsSubmitting(true);
    try {
      if (!player.id) throw new Error("Player ID is missing.");
      console.log("Submitting player update to doc ID:", player.id, "with values:", values);
      
      const playerRef = doc(firestore, "users", player.id);
      await updateDoc(playerRef, {
        ...values,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "✅ Player Updated!",
        description: `${values.displayName}'s profile has been updated.`,
      });

      onFormSubmit("update", player.id);
      onClose();
    } catch (error: any) {
      console.error("Error updating player:", error);
      const errorMessage =
        error?.code === "permission-denied"
          ? "Permission denied: only admins can update player data."
          : error.message || "Failed to update player profile.";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-white/10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Edit Player: {player.displayName}</DialogTitle>
              <VisuallyHidden>
                <DialogDescription>
                  Update player details below.
                </DialogDescription>
              </VisuallyHidden>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                <FormField control={form.control} name="displayName" render={({ field }) => (
                    <FormItem><FormLabel>Display Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="username" render={({ field }) => (
                    <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="xp" render={({ field }) => (
                    <FormItem><FormLabel>XP</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="trainingStreak" render={({ field }) => (
                    <FormItem><FormLabel>Training Streak</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                 <FormField control={form.control} name="winStreak" render={({ field }) => (
                    <FormItem><FormLabel>Win Streak</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>

                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem><FormLabel>Role</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="player">Player</SelectItem>
                            <SelectItem value="coach">Coach</SelectItem>
                            <SelectItem value="moderator">Moderator</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem><FormLabel>Status</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
                )}/>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
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
