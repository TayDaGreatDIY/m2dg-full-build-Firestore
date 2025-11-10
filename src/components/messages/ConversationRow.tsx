"use client";

import type { Conversation } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from "react";

type ConversationRowProps = {
  conversation: Conversation;
};

export default function ConversationRow({ conversation }: ConversationRowProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (conversation.lastMessage?.sentAt) {
      // Check if sentAt is a Firestore Timestamp
      if (typeof conversation.lastMessage.sentAt.toDate === 'function') {
        setTimeAgo(formatDistanceToNow(conversation.lastMessage.sentAt.toDate(), { addSuffix: true }));
      }
    }
  }, [conversation.lastMessage]);

  if (!conversation.otherUser) return null;

  return (
    <Link href={`/messages/${conversation.id}`} className="block">
      <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-3 flex items-center gap-4 transition-colors hover:bg-white/5">
        <UserAvatar src={conversation.otherUser.avatarURL} name={conversation.otherUser.username} size={44} />
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-baseline">
            <p className="font-bold text-sm">@{conversation.otherUser.username}</p>
            {timeAgo && (
                <p className="text-xs text-white/40">
                {timeAgo}
                </p>
            )}
          </div>
          <p className="text-sm text-white/60 truncate">{conversation.lastMessage?.text || 'No messages yet'}</p>
        </div>
      </div>
    </Link>
  );
}
