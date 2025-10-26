
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/button";
import ConversationRow from "@/components/messages/ConversationRow";
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import type { Chat, User } from "@/lib/types";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const chatsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "chats"), where("memberIds", "array-contains", user.uid));
  }, [user, firestore]);
    
  const { data: rawChats, isLoading } = useCollection<Chat>(chatsQuery);
  const [chats, setChats] = useState<Chat[]>([]);
  const [enrichLoading, setEnrichLoading] = useState(true);

  useEffect(() => {
    async function enrichChats() {
      if (!firestore || !user || !rawChats) {
        setChats([]);
        setEnrichLoading(false);
        return;
      }
      
      setEnrichLoading(true);
      const enriched = await Promise.all(rawChats.map(async (chat) => {
        const otherUserId = chat.memberIds.find(id => id !== user.uid);
        if (!otherUserId) return chat;

        const userDocRef = doc(firestore, 'users', otherUserId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const otherUserData = userDocSnap.data() as User;
          return {
            ...chat,
            otherUser: {
              username: otherUserData.username,
              avatarURL: otherUserData.avatarURL,
            }
          };
        }
        return chat;
      }));
      setChats(enriched);
      setEnrichLoading(false);
    }

    if (rawChats) {
        enrichChats();
    }
  }, [rawChats, user, firestore]);


  const hasConversations = chats.length > 0;
  const pageLoading = isLoading || enrichLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Messages" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
            <div className="flex justify-end">
            <Button variant="outline" size="sm">
                <Plus size={16} className="mr-1" />
                New DM
            </Button>
            </div>
            
            {pageLoading ? (
            <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
            ) : hasConversations ? (
            <div className="space-y-3">
                {chats.map((convo) => (
                convo.otherUser && <ConversationRow key={convo.id} conversation={convo} />
                ))}
            </div>
            ) : (
            <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-card border border-white/10">
                <h3 className="font-bold font-headline text-lg">No conversations yet</h3>
                <p className="text-sm text-white/50 mt-1">Start a chat with other ballers.</p>
            </div>
            )}
        </div>
      </main>
    </div>
  );
}
