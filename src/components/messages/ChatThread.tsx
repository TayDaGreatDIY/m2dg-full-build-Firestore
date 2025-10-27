
"use client";

import React, { useState, useRef, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { Message, Chat, User as AppUser } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2 } from "lucide-react";

type ChatThreadProps = {
  chatId: string;
};

export default function ChatThread({ chatId }: ChatThreadProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatDocRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);

  const { data: chat } = useDoc<Chat>(chatDocRef);


  useEffect(() => {
    if (!chatId || !firestore) return;
    const messagesQuery = query(
      collection(firestore, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chatId, firestore]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user || !firestore || !chat) return;

    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    const chatDocRef = doc(firestore, 'chats', chatId);
    const otherUserId = chat.memberIds.find(id => id !== user.uid);

    if (!otherUserId) {
        console.error("Could not find other user in chat.");
        return;
    }

    const notificationColRef = collection(firestore, "users", otherUserId, "notifications");

    try {
      await addDoc(messagesColRef, {
        userId: user.uid,
        text: newMessage,
        createdAt: serverTimestamp(),
      });
      
      await updateDoc(chatDocRef, {
        lastMessage: newMessage,
        lastTimestamp: serverTimestamp(),
      });

      // Create a notification for the other user
      await addDoc(notificationColRef, {
          userId: otherUserId,
          fromId: user.uid,
          fromName: user.displayName,
          type: "new_message",
          link: `/messages/${chatId}`,
          read: false,
          createdAt: serverTimestamp(),
      });


      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-end gap-2",
              msg.userId === user?.uid ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs md:max-w-md rounded-2xl px-4 py-2",
                msg.userId === user?.uid
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
