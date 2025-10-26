"use client";

import TopNav from "@/components/ui/TopNav";
import PostCard from "@/components/feed/PostCard";
import { Button } from "@/components/ui/button";
import { demoFeed } from "@/lib/demoData";

export default function FeedPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Feed" />
        
        <div className="flex justify-end">
            <Button variant="outline" size="sm">Post Highlight</Button>
        </div>

        <div className="space-y-4">
          {demoFeed.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </main>
    </div>
  );
}
