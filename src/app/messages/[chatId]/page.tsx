
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChatThread from "@/components/messages/ChatThread";
import UserAvatar from "@/components/ui/UserAvatar";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import type { Chat, User as AppUser } from "@/lib/types";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const chatId = params.chatId as string;
  
  const chatDocRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);

  const { data: chat, isLoading: isChatLoading } = useDoc<Chat>(chatDocRef);

  const otherUserId = chat?.participants.find(id => id !== authUser?.uid);
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !otherUserId) return null;
    return doc(firestore, 'users', otherUserId);
  }, [firestore, otherUserId]);

  const { data: otherUser, isLoading: isUserLoading } = useDoc<AppUser>(userDocRef);

  const loading = isChatLoading || isUserLoading;

  useEffect(() => {
    if (!isChatLoading && !chat) {
      // If the chat doesn't exist after loading, maybe redirect
      console.warn(`Chat with ID ${chatId} not found.`);
      // router.push('/messages');
    }
  }, [isChatLoading, chat, router, chatId]);

  if (loading) {
    return <div className="flex h-screen max-w-md mx-auto items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }
  
  if (!chat || !otherUser) {
    return <div className="flex h-screen max-w-md mx-auto items-center justify-center"><p>Chat not found.</p></div>;
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
      <ChatThread chatId={chatId} />
    </div>
  );
}
    
