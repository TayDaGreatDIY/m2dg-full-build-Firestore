"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { playerHighlights, ownerPlaylist, motivationalSpeeches, Video } from "@/lib/videoData";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

const VideoCard = ({ video }: { video: Video }) => {
  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer" className="block group">
      <Card className="bg-card border-white/10 overflow-hidden h-full flex flex-col transition-transform group-hover:scale-105">
        <div className="relative aspect-video">
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
            data-ai-hint={video.imageHint}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <PlayCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        <CardContent className="p-3 flex-1 flex flex-col">
          <h3 className="font-bold font-headline text-base text-white flex-1">{video.title}</h3>
          <p className="text-xs text-white/60 mt-1">{video.description}</p>
        </CardContent>
      </Card>
    </a>
  );
};

export default function MotivationalMindsetPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Motivational Mindset" />
      <main className="flex-1 w-full p-4 pb-24 space-y-8 md:p-6">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-headline tracking-tight">Train Your Mind</h2>
            <p className="text-sm text-white/50">Curated videos to fuel your grind and sharpen your mental game.</p>
          </div>

          <section>
            <h3 className="text-xl font-bold font-headline text-orange mb-4">Player Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {playerHighlights.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold font-headline text-orange mb-4">Owner's Playlist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ownerPlaylist.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold font-headline text-orange mb-4">Motivational Speeches</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {motivationalSpeeches.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
