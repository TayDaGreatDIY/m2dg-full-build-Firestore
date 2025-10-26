
"use client";

import type { Chat } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';

type ConversationRowProps = {
  conversation: Chat;
};

export default function ConversationRow({ conversation }: ConversationRowProps) {
  if (!conversation.otherUser) return null;

  return (
    <Link href={`/messages/${conversation.id}`} className="block">
      <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-3 flex items-center gap-4 transition-colors hover:bg-white/5">
        <UserAvatar src={conversation.otherUser.avatarURL} name={conversation.otherUser.username} size={44} />
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline">
            <p className="font-bold text-sm">@{conversation.otherUser.username}</p>
            <p className="text-xs text-white/40">
              {conversation.lastTimestamp ? formatDistanceToNow(conversation.lastTimestamp.toDate(), { addSuffix: true }) : ''}
            </p>
          </div>
          <p className="text-sm text-white/60 truncate">{conversation.lastMessage}</p>
        </div>
      </div>
    </Link>
  );
}
