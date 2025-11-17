
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { Button } from "@/components/ui/button";
import ConversationRow from "@/components/messages/ConversationRow";
import { useUser, useCollection, useMemoFirebase, useFirestore } from "@/firebase";
import type { Conversation, User as AppUser } from "@/lib/types";
import { collection, query, where, getDoc, doc } from "firebase/firestore";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import NewMessageDialog from "@/components/messages/NewMessageDialog";

export default function MessagesPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const conversationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // This is the critical fix: adding the 'where' clause to match security rules.
    return query(collection(firestore, "conversations"), where("memberIds", "array-contains", user.uid));
  }, [user, firestore]);
    
  const { data: rawConversations, isLoading } = useCollection<Conversation>(conversationsQuery);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [enrichLoading, setEnrichLoading] = useState(true);

  useEffect(() => {
    async function enrichConversations() {
      if (!firestore || !user || !rawConversations) {
        setConversations([]);
        setEnrichLoading(false);
        return;
      }
      
      setEnrichLoading(true);
      const enriched = await Promise.all(rawConversations.map(async (convo) => {
        const otherUserId = convo.memberIds.find(id => id !== user.uid);
        if (!otherUserId) return convo;

        const userDocRef = doc(firestore, 'users', otherUserId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const otherUserData = userDocSnap.data() as AppUser;
          return {
            ...convo,
            otherUser: {
              uid: otherUserData.uid,
              username: otherUserData.username,
              avatarURL: otherUserData.avatarURL,
            }
          };
        }
        return convo;
      }));
      setConversations(enriched);
      setEnrichLoading(false);
    }

    if (rawConversations) {
      enrichConversations();
    }
  }, [rawConversations, user, firestore]);


  const hasConversations = conversations.length > 0;
  const pageLoading = isLoading || enrichLoading;

  return (
    <>
      <NewMessageDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
      <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Messages" />
        <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
          <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
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
                  {conversations.map((convo) => (
                    <ConversationRow key={convo.id} conversation={convo} />
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
    </>
  );
}
