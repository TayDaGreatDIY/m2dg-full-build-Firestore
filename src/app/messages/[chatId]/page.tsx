
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import ChatThread from "@/components/messages/ChatThread";
import UserAvatar from "@/components/ui/UserAvatar";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Chat, User } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const chatId = params.chatId as string;
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatId || !authUser) return;

    const chatDocRef = doc(db, 'chats', chatId);
    const unsubscribe = onSnapshot(chatDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const chatData = { id: docSnap.id, ...docSnap.data() } as Chat;
        setChat(chatData);

        const otherUserId = chatData.memberIds.find(id => id !== authUser.uid);
        if (otherUserId) {
          const userDocRef = doc(db, 'users', otherUserId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setOtherUser({ uid: userDocSnap.id, ...userDocSnap.data() } as User);
          }
        }
      } else {
        router.push('/messages');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, authUser, router]);

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
