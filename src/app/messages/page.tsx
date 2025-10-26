
"use client";

import TopNav from "@/components/ui/TopNav";
import { Button } from "@/components/ui/button";
import ConversationRow from "@/components/messages/ConversationRow";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useCollection";
import type { Chat, User } from "@/lib/types";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

export default function MessagesPage() {
  const { user } = useAuth();
  
  const chatsQuery = user 
    ? query(collection(db, "chats"), where("memberIds", "array-contains", user.uid))
    : undefined;
    
  const { data: rawChats, loading } = useCollection<Chat>('chats', chatsQuery);
  const [chats, setChats] = useState<Chat[]>([]);
  const [enrichLoading, setEnrichLoading] = useState(true);

  useEffect(() => {
    async function enrichChats() {
      if (rawChats.length === 0 || !user) {
        setChats([]);
        setEnrichLoading(false);
        return;
      }
      
      setEnrichLoading(true);
      const enriched = await Promise.all(rawChats.map(async (chat) => {
        const otherUserId = chat.memberIds.find(id => id !== user.uid);
        if (!otherUserId) return chat;

        const userDocRef = doc(db, 'users', otherUserId);
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

    enrichChats();
  }, [rawChats, user]);


  const hasConversations = chats.length > 0;
  const pageLoading = loading || enrichLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Messages" />
        
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
      </main>
    </div>
  );
}
