"use client";

import {
  playerHighlights,
  ownerPlayList,
  motivationalSpeeches,
  type Video,
} from "@/lib/videoData";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

// 🎥 Video Card Component
const VideoCard = ({ video }: { video: Video }) => (
  <a
    href={video.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block group"
  >
    <Card className="bg-card border-white/10 overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow">
      <div className="relative aspect-video">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          className="object-cover transition-opacity group-hover:opacity-75"
          data-ai-hint="video.imageHint"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <PlayCircle className="w-12 h-12 text-white" />
        </div>
      </div>
      <CardContent className="p-4">
        <p className="font-semibold text-white text-lg">{video.title}</p>
      </CardContent>
    </Card>
  </a>
);

// 📺 Section Renderer Component
const Section = ({ title, videos }: { title: string; videos: Video[] }) => (
  <section className="space-y-6">
    <h3 className="text-2xl font-bold font-headline text-orange mb-4 border-b border-orange/40 pb-2">
      {title}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  </section>
);

// 🧠 Motivational Mindset Page
export default function MotivationalMindsetPage() {
  return (
    <main className="p-8 space-y-12 bg-gradient-to-b from-black via-gray-900 to-black min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Motivational Mindset
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Unlock your full potential with motivational speeches, player
            highlights, and playlists from the M2DG community.
          </p>
        </header>

        {/* Player Highlights */}
        <Section title="🏀 Player Highlights" videos={playerHighlights} />

        {/* Owner’s Playlist */}
        <Section title="🎧 Owner’s Playlist" videos={ownerPlayList} />

        {/* Motivational Speeches */}
        <Section title="💬 Motivational Speeches" videos={motivationalSpeeches} />
      </div>
    </main>
  );
}
