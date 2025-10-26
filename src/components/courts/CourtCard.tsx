
"use client";

import Image from "next/image";
import type { Court } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CourtCardProps = {
  court: Court;
};

const placeholderImages: { [key: string]: string } = {
  'The Cage': 'https://images.unsplash.com/photo-1579303384242-4b65219b52b8?q=80&w=800&h=400&fit=crop',
  'Venice Beach': 'https://images.unsplash.com/photo-1606833958043-a403a55806b8?q=80&w=800&h=400&fit=crop',
  'Goat Park': 'https://images.unsplash.com/photo-1561335979-c5c559816e87?q=80&w=800&h=400&fit=crop',
};

export default function CourtCard({ court }: CourtCardProps) {
  const imageUrl = court.img || placeholderImages[court.name] || 'https://picsum.photos/seed/court/800/400';
  
  return (
    <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 overflow-hidden">
      <div className="relative h-32 w-full">
        <Image src={imageUrl} alt={court.name} fill style={{ objectFit: 'cover' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-2 left-3">
            <h3 className="font-bold text-lg text-white font-headline tracking-tight">{court.name}</h3>
            <p className="text-sm text-white/70">{court.city}</p>
        </div>
      </div>
      <div className="p-3 flex justify-between items-center">
        <Badge variant="gold">{court.statusTag}</Badge>
        <Button variant="outline" size="sm">Details</Button>
      </div>
    </div>
  );
}
