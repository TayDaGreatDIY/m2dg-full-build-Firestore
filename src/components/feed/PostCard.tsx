"use client";

import type { FeedPost } from "@/lib/types";
import UserAvatar from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

type PostCardProps = {
  post: FeedPost;
};

export default function PostCard({ post }: PostCardProps) {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <UserAvatar src={post.avatar} name={post.user} size={40} />
        <div>
          <p className="font-bold text-sm">@{post.user}</p>
          <p className="text-xs text-white/50">{post.ts}</p>
        </div>
      </div>
      <p className="text-white/90 text-sm leading-relaxed">{post.text}</p>
      <div className="flex items-center justify-between text-xs text-white/50">
        <div className="flex items-center gap-1.5">
          <MapPin size={14} />
          <span>{post.court}</span>
        </div>
        {post.streak && post.streak >= 5 && (
          <Badge variant="orange" className="font-bold">{post.streak}-GAME STREAK 🔥</Badge>
        )}
      </div>
    </div>
  );
}
