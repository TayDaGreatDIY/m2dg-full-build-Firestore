"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { User as AppUser } from "@/lib/types";
import { openOrCreateConversation } from "@/lib/chat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import UserAvatar from "@/components/ui/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";


type NewMessageDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export default function NewMessageDialog({ isOpen, onOpenChange }: NewMessageDialogProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return query(collection(firestore, "users"), where("uid", "!=", currentUser.uid));
  }, [firestore, currentUser]);

  const { data: users, isLoading } = useCollection<AppUser>(usersQuery);

  const handleUserSelect = async (selectedUser: AppUser) => {
    if (!currentUser || isCreatingChat) return;

    setIsCreatingChat(true);

    try {
      const conversationId = await openOrCreateConversation(currentUser.uid, selectedUser.uid);
      router.push(`/messages/${conversationId}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error opening or creating chat:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start a new conversation.",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--color-bg-card)] border-white/10">
        <DialogHeader>
          <DialogTitle className="font-headline">New Message</DialogTitle>
          <DialogDescription>Select a baller to start a conversation.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full pr-4">
          <div className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))
            ) : users && users.length > 0 ? (
              users.map((user) => (
                <button
                  key={user.uid}
                  className="w-full text-left p-2 rounded-md hover:bg-white/5 transition-colors flex items-center gap-3 disabled:opacity-50"
                  onClick={() => handleUserSelect(user)}
                  disabled={isCreatingChat}
                >
                  <UserAvatar src={user.avatarURL} name={user.username} size={40} />
                  <div>
                    <p className="font-bold text-sm">{user.displayName}</p>
                    <p className="text-xs text-white/50">@{user.username}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-white/50 text-center py-10">No other users found.</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
