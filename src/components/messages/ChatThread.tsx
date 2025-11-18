'use client';

import React, { useState, useRef, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { sendMessage } from "@/lib/chat";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { ShieldAlert } from "lucide-react";

type ChatThreadProps = {
  conversationId: string;
};

export default function ChatThread({ conversationId }: ChatThreadProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conversationId || !firestore) return;

    setLoading(true);
    setError(null);
    const messagesQuery = query(
      collection(firestore, 'conversations', conversationId, 'messages'),
      orderBy('sentAt', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
        console.error("Error fetching messages:", err);
        setError('Could not load messages. You may not have permission to view this chat.');
        setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId, firestore]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user) return;

    try {
        await sendMessage(conversationId, user.uid, newMessage.trim());
        setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast({ variant: 'destructive', title: 'Send Failed', description: error.message || 'Could not send your message.'});
    }
  };
  
  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (error) {
     return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error Loading Chat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2",
              msg.senderId === user?.uid ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs md:max-w-md rounded-2xl px-4 py-2",
                msg.senderId === user?.uid
                  ? "bg-orange text-black rounded-br-none"
                  : "bg-white/10 text-white rounded-bl-none"
              )}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[var(--color-bg-card)] border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Button variant="ghost" size="icon" type="button">
            <Paperclip className="text-white/50" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background"
            autoComplete="off"
            disabled={!user}
          />
          <Button variant="primary" size="icon" type="submit" disabled={!newMessage.trim() || !user}>
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}
