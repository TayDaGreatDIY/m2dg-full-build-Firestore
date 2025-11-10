
"use client";

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, VisuallyHidden } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


type HostRunDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  courtId: string;
  courtName: string;
};

export default function HostRunDialog({ isOpen, onOpenChange, courtId, courtName }: HostRunDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to host a run.' });
      return;
    }
    if (!time) {
      toast({ variant: 'destructive', title: 'Please enter a time for the run.' });
      return;
    }

    setIsLoading(true);
    try {
      const runsCollectionRef = collection(firestore, 'courts', courtId, 'runs');
      await addDoc(runsCollectionRef, {
        hostUid: user.uid,
        hostName: user.displayName,
        time: time,
        note: note,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Run hosted!', description: `Your run at ${courtName} is now listed.` });
      onOpenChange(false);
      setTime('');
      setNote('');
    } catch (error) {
      console.error("Error hosting run:", error);
      toast({ variant: 'destructive', title: 'Failed to host run' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--color-bg-card)] border-white/10">
        <DialogHeader>
          <DialogTitle className="font-headline">Host a Run at {courtName}</DialogTitle>
          <DialogDescription>Let everyone know when the game is on.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">Time</Label>
            <Input
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g., 7:30 PM"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="note" className="text-right">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., 2 more for 5s"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Host Run'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    