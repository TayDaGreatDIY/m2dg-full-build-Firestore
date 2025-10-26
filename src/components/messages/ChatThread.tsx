"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import type { ChatMessage } from "@/lib/types";
import { demoChatMessagesById } from "@/lib/demoData";
import { useAuthUser } from "@/hooks/useAuthUser";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send } from "lucide-react";

export default function ChatThread() {
  const params = useParams();
  const chatId = params.chatId as string;
  const { user } = useAuthUser();
  
  const [messages, setMessages] = useState<ChatMessage[]>(demoChatMessagesById[chatId] || []);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      from: user.username,
      text: newMessage,
      timestamp: "Just now",
    };

    setMessages([...messages, message]);
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2",
              msg.from === user.username ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs md:max-w-md rounded-2xl px-4 py-2",
                msg.from === user.username
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
          />
          <Button variant="primary" size="icon" type="submit">
            <Send />
          </Button>
        </form>
      </div>
    </div>
  );
}
