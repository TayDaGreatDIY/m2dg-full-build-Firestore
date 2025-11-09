'use client';

import { useState, useRef, useEffect } from 'react';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, Loader2, Mic, Speaker, Play, Pause } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/ui/UserAvatar';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { aiTrainerFlow } from '@/ai/flows/ai-trainer-flow';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string | null;
};

export default function AiTrainerPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [activeAudio, setActiveAudio] = useState<string | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  useEffect(() => {
    setMessages([{
        role: 'assistant',
        content: "Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game."
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setActiveAudio(null);
    }
  }, [activeAudio]);

  const playAudio = (url: string) => {
    if (audioRef.current && activeAudio === url) {
      audioRef.current.pause();
      setActiveAudio(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
      setActiveAudio(url);
    }
  };

  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        variant: 'destructive',
        title: 'Voice not supported',
        description: 'Your browser does not support voice recognition.',
      });
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (event: any) => {
      const speech = event.results[0][0].transcript;
      setInput(speech);
      handleSubmit(null, speech);
    };

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };
    
    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        toast({
            variant: "destructive",
            title: "Voice Error",
            description: `Could not process audio: ${event.error}`
        });
        setIsListening(false);
    };
    
    recognitionRef.current.start();
  };

  const handleSubmit = async (e?: React.FormEvent, voiceInput?: string) => {
    e?.preventDefault();
    const currentInput = voiceInput || input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const { reply, audioUrl } = await aiTrainerFlow({ prompt: currentInput, voice: true });
        const assistantMessage: Message = { role: 'assistant', content: reply, audioUrl };
        setMessages((prev) => [...prev, assistantMessage]);

        if (autoPlay && audioUrl) {
            playAudio(audioUrl);
        }
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
        <div className='flex items-center justify-end px-4 pt-2'>
             <div className="flex items-center space-x-2">
                <Switch id="autoplay-switch" checked={autoPlay} onCheckedChange={setAutoPlay} />
                <Label htmlFor="autoplay-switch" className='text-xs text-white/60'>Auto-play Voice</Label>
            </div>
        </div>
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
                    'max-w-md rounded-2xl px-4 py-3 text-sm shadow-md group relative',
                    m.role === 'user'
                      ? 'bg-secondary text-white rounded-br-none'
                      : 'bg-card text-white/90 rounded-bl-none'
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                   {m.audioUrl && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -bottom-4 -right-2 h-8 w-8 rounded-full bg-card hover:bg-orange/80 group-hover:opacity-100 opacity-60 transition-opacity"
                        onClick={() => playAudio(m.audioUrl!)}
                    >
                        {activeAudio === m.audioUrl ? <Pause size={14} /> : <Play size={14} />}
                    </Button>
                  )}
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
             <Button type="button" size="icon" variant={isListening ? "destructive" : "outline"} onClick={handleStartListening} disabled={isLoading}>
              <Mic />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your coach anything..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send />
            </Button>
          </form>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
