'use client';

import { useState, useRef, useEffect } from 'react';
import { getTrainerReply } from '@/ai/trainerModel';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/ui/UserAvatar';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiTrainerPage() {
  const { user: authUser } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://getaitrainerreply-qhmdrry7ca-uc.a.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI trainer.');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting. Please try again later.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <DesktopHeader pageTitle="AI Trainer" />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6 pb-4">
            {messages.length === 0 && (
              <div className="text-center p-8 rounded-lg bg-card border border-white/10">
                <Bot className="mx-auto h-12 w-12 text-orange" />
                <h2 className="mt-4 text-xl font-bold font-headline">Your Personal AI Coach</h2>
                <p className="mt-2 text-sm text-white/60">
                  Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game.
                </p>
              </div>
            )}
            {messages.map((m, index) => (
              <div
                key={index}
                className={cn('flex items-start gap-4', m.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {m.role !== 'user' && (
                  <div className="p-2 bg-orange rounded-full">
                    <Bot className="h-6 w-6 text-black" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-2xl px-4 py-3 text-sm',
                    m.role === 'user'
                      ? 'bg-secondary text-white rounded-br-none'
                      : 'bg-card text-white/90 rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <UserAvatar src={authUser?.photoURL || ''} name={authUser?.displayName || ''} size={40} />
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange rounded-full">
                  <Bot className="h-6 w-6 text-black" />
                </div>
                <div className="bg-card rounded-2xl rounded-bl-none px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your coach for a workout plan..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input}>
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
