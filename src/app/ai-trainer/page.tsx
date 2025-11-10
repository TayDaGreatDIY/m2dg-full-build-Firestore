
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, Loader2, Mic } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/ui/UserAvatar';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, collection, query, orderBy, limit, onSnapshot, Unsubscribe, addDoc, serverTimestamp } from 'firebase/firestore';
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
};

export default function AiTrainerPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => { viewport.scrollTop = viewport.scrollHeight; }, 0);
      }
    }
  };

  useEffect(() => {
    if (!authUser || !firestore) return;
    const memoryRef = collection(firestore, "aiTrainerMemory", authUser.uid, "messages");
    const q = query(memoryRef, orderBy("timestamp", "desc"), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const history = snapshot.docs.reverse().map(doc => doc.data() as Message);
        if (history.length === 0) {
            setMessages([{ role: 'assistant', content: "Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game." }]);
        } else {
            setMessages(history);
        }
    }, (error) => {
        console.warn("Could not load chat history:", error);
        setMessages([{ role: 'assistant', content: "Ready to take your game to the next level? Ask me anything from creating a workout plan to analyzing your last game." }]);
    });
    
    return () => unsubscribe();
  }, [authUser, firestore]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleToggleAutoPlay = (checked: boolean) => {
    setAutoPlay(checked);
    if (!checked && audioRef.current) audioRef.current.pause();
  };

  const handleStartListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: 'destructive', title: 'Voice not supported' });
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onresult = (event: any) => {
      const speech = event.results[0][0].transcript;
      setInput(speech);
      handleSubmit(undefined, speech);
    };
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = (event: any) => {
        toast({ variant: "destructive", title: "Voice Error", description: `Could not process audio: ${event.error}` });
        setIsListening(false);
    };
    recognitionRef.current.start();
  };
  
  const saveMessage = (message: Message) => {
    if (!authUser || !firestore) return;
    const messageRef = collection(firestore, 'aiTrainerMemory', authUser.uid, "messages");
    addDoc(messageRef, { ...message, timestamp: serverTimestamp() });
  };

  const handleSubmit = async (e?: React.FormEvent, voiceInput?: string) => {
    e?.preventDefault();
    const currentInput = voiceInput || input;
    if (!currentInput.trim() || isLoading || !authUser) return;

    const userMessage: Message = { role: 'user', content: currentInput };
    setMessages(prev => [...prev, userMessage]);
    saveMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const plainHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const { reply, audioUrl } = await aiTrainerFlow({ prompt: currentInput, history: plainHistory });
      
      const assistantMessage: Message = { role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMessage]);
      saveMessage(assistantMessage);

      if (autoPlay && audioUrl) {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play().catch(e => console.error("Audio playback failed", e));
      }
    } catch (error) {
      console.error('AI Trainer error:', error);
      const errorMessage: Message = { role: 'assistant', content: '⚠️ I’m having trouble connecting. Please try again in a moment.' };
      setMessages(prev => [...prev, errorMessage]);
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
            <Switch id="autoplay-switch" checked={autoPlay} onCheckedChange={handleToggleAutoPlay} />
            <Label htmlFor="autoplay-switch" className='text-xs text-white/60'>Auto-play Voice</Label>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-6 pb-4">
            {messages.map((m, index) => (
              <div key={index} className={cn('flex items-start gap-4', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role !== 'user' && (
                  <div className="p-2 bg-orange rounded-full">
                    <Bot className="h-6 w-6 text-black" />
                  </div>
                )}
                <div className={cn('max-w-md rounded-2xl px-4 py-3 text-sm shadow-md', m.role === 'user' ? 'bg-secondary text-white rounded-br-none' : 'bg-card text-white/90 rounded-bl-none')}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (<UserAvatar src={authUser?.photoURL || ''} name={authUser?.displayName || ''} size={40} />)}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                <div className="p-2 bg-orange rounded-full"><Bot className="h-6 w-6 text-black" /></div>
                <div className="bg-card rounded-2xl rounded-bl-none px-4 py-3 shadow-md"><Loader2 className="h-5 w-5 animate-spin text-white/50" /></div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Button type="button" size="icon" variant={isListening ? "destructive" : "outline"} onClick={handleStartListening} disabled={isLoading}>
              <Mic />
            </Button>
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your coach anything..." className="flex-1" autoComplete="off" />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

    