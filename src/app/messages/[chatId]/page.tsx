"use client";

import { useParams, useRouter } from "next/navigation";
import { demoConversations } from "@/lib/demoData";
import ChatThread from "@/components/messages/ChatThread";
import UserAvatar from "@/components/ui/UserAvatar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const conversation = demoConversations.find(c => c.id === chatId);

  if (!conversation) {
    // In a real app, you might show a 404 page or redirect
    if (typeof window !== 'undefined') {
      router.push('/messages');
    }
    return null;
  }

  const { otherUser } = conversation;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[var(--color-bg-main)]">
      <header className="flex items-center gap-3 p-3 border-b border-white/10 bg-[var(--color-bg-card)] sticky top-0 z-10">
        <Link href="/messages">
          <ChevronLeft className="w-6 h-6 text-white/80" />
        </Link>
        <UserAvatar src={otherUser.avatar} name={otherUser.username} size={36} />
        <div>
          <p className="font-bold text-sm">@{otherUser.username}</p>
        </div>
      </header>
      <ChatThread />
    </div>
  );
}
