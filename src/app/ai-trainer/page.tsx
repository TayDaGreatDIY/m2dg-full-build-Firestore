
'use client';

import { useState, useRef, useEffect } from 'react';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/ui/UserAvatar';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { aiTrainerFlow, retrieveHistoryFlow } from '@/ai/flows/ai-trainer-flow';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AiTrainerPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 0);
      }
    }
  };
  
  // Load message history on initial load
  useEffect(() => {
    async function loadHistory() {
      if (!authUser) {
        setIsLoading(false);
        // Add initial welcome message if there's no user
         setMessages([{
            role: 'assistant',
            content: "Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game."
        }]);
        return;
      };

      try {
        const { history } = await retrieveHistoryFlow(authUser.uid);
        if (history && history.length > 0) {
            const formattedHistory = history.map((m: any) => ({ role: m.role, content: m.content }));
            setMessages(formattedHistory);
        } else {
            // If no history, add the initial welcome message
            setMessages([{
                role: 'assistant',
                content: "Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game."
            }]);
        }
      } catch (error) {
         console.error('Failed to load chat history:', error);
         toast({
            variant: 'destructive',
            title: 'History Error',
            description: 'Could not load previous conversation.',
         });
         // Fallback to welcome message on error
          setMessages([{
            role: 'assistant',
            content: "Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game."
        }]);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !authUser) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
        const { reply } = await aiTrainerFlow({ prompt: currentInput, userId: authUser.uid });
        const assistantMessage: Message = { role: 'assistant', content: reply };
        setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Trainer error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Trainer Error',
        description: 'I’m having trouble connecting to the trainer right now. Please try again in a moment.',
      });
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ I’m having trouble connecting. Please try again in a moment.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <DesktopHeader pageTitle="AI Trainer" />
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full min-h-0">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6 pb-4">
            {messages.map((m, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-4',
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {m.role !== 'user' && (
                  <div className="p-2 bg-orange rounded-full">
                    <Bot className="h-6 w-6 text-black" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-md rounded-2xl px-4 py-3 text-sm shadow-md',
                    m.role === 'user'
                      ? 'bg-secondary text-white rounded-br-none'
                      : 'bg-card text-white/90 rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <UserAvatar
                    src={authUser?.photoURL || ''}
                    name={authUser?.displayName || ''}
                    size={40}
                  />
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange rounded-full">
                  <Bot className="h-6 w-6 text-black" />
                </div>
                <div className="bg-card rounded-2xl rounded-bl-none px-4 py-3 shadow-md">
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
              disabled={!authUser}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !authUser}>
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
