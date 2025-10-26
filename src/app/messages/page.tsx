"use client";

import TopNav from "@/components/ui/TopNav";
import { Button } from "@/components/ui/button";
import ConversationRow from "@/components/messages/ConversationRow";
import { demoConversations } from "@/lib/demoData";
import { Plus } from "lucide-react";

export default function MessagesPage() {
  const hasConversations = demoConversations.length > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Messages" />
        
        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            <Plus size={16} className="mr-1" />
            New DM
          </Button>
        </div>
        
        {hasConversations ? (
          <div className="space-y-3">
            {demoConversations.map((convo) => (
              <ConversationRow key={convo.id} conversation={convo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--color-bg-card)] rounded-card border border-white/10">
            <h3 className="font-bold font-headline text-lg">No conversations yet</h3>
            <p className="text-sm text-white/50 mt-1">Start a chat with other ballers.</p>
          </div>
        )}
      </main>
    </div>
  );
}
