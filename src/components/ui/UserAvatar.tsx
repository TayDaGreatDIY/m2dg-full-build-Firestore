"use client";

import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserAvatarProps = {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
};

export default function UserAvatar({ src, name, size = 40, className }: UserAvatarProps) {
  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : '??';

  return (
    <Avatar 
      className={className} 
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full rounded-full ring-2 ring-gold/30 border-2 border-gold/50">
        <AvatarImage src={src} alt={name || 'User avatar'} className="rounded-full" />
        <AvatarFallback className="bg-muted text-muted-foreground rounded-full">
          {initials}
        </AvatarFallback>
      </div>
    </Avatar>
  );
}
