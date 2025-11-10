"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChatThread from "@/components/messages/ChatThread";
import UserAvatar from "@/components/ui/UserAvatar";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { doc } from "firebase/firestore";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Conversation, User as AppUser } from "@/lib/types";

export default function ChatPage() {
  const params = useParams();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const conversationId = params.chatId as string;
  
  const conversationDocRef = useMemoFirebase(() => {
    if (!firestore || !conversationId) return null;
    return doc(firestore, 'conversations', conversationId);
  }, [firestore, conversationId]);

  const { data: conversation, isLoading: isConversationLoading } = useDoc<Conversation>(conversationDocRef);

  const otherUserId = conversation?.memberIds.find(id => id !== authUser?.uid);
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !otherUserId) return null;
    return doc(firestore, 'users', otherUserId);
  }, [firestore, otherUserId]);

  const { data: otherUser, isLoading: isUserLoading } = useDoc<AppUser>(userDocRef);

  const loading = isConversationLoading || isUserLoading;

  if (loading) {
    return <div className="flex h-screen max-w-md mx-auto items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }
  
  if (!conversation || !otherUser) {
    return <div className="flex h-screen max-w-md mx-auto items-center justify-center"><p>Conversation not found.</p></div>;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[var(--color-bg-main)]">
      <header className="flex items-center gap-3 p-3 border-b border-white/10 bg-[var(--color-bg-card)] sticky top-0 z-10">
        <Link href="/messages">
          <ChevronLeft className="w-6 h-6 text-white/80" />
        </Link>
        <UserAvatar src={otherUser.avatarURL} name={otherUser.username} size={36} />
        <div>
          <p className="font-bold text-sm">@{otherUser.username}</p>
        </div>
      </header>
      <ChatThread conversationId={conversationId} otherUserId={otherUserId} />
    </div>
  );
}
