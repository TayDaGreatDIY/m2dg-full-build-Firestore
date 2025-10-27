
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

// One-time function to seed initial court data
const seedInitialCourts = async (db: any) => {
  const batch = writeBatch(db);

  const courts = [
    { id: 'the-cage-nyc', name: 'The Cage', city: 'New York, NY', statusTag: 'Runs Tonight', img: 'https://images.unsplash.com/photo-1579303384242-4b65219b52b8?q=80&w=800&h=400&fit=crop' },
    { id: 'venice-beach-la', name: 'Venice Beach', city: 'Los Angeles, CA', statusTag: 'Always Busy', img: 'https://images.unsplash.com/photo-1606833958043-a403a55806b8?q=80&w=800&h=400&fit=crop' },
    { id: 'goat-park-il', name: 'Goat Park', city: 'Chicago, IL', statusTag: 'Pickup at 5pm', img: 'https://images.unsplash.com/photo-1561335979-c5c559816e87?q=80&w=800&h=400&fit=crop' },
  ];

  courts.forEach(court => {
    const courtRef = doc(db, "courts", court.id);
    batch.set(courtRef, court);
  });

  try {
    await batch.commit();
    console.log("Initial courts seeded successfully.");
  } catch (error) {
    // We can ignore errors if the data already exists.
    if ((error as any).code !== 'permission-denied') {
        // A permission-denied error likely means the documents already exist and we're not allowed to overwrite them, which is fine.
        console.warn("Court seeding failed (might be due to existing data):", error);
    }
  }
};


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const handleAuthAction = async (action: 'login' | 'signup') => {
    setIsLoading(true);
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Please enter both email and password.',
      });
      setIsLoading(false);
      return;
    }

    try {
      let userCredential;
      if (action === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const username = email.split('@')[0];
        
        // Seed courts and create user doc
        await Promise.all([
          seedInitialCourts(db),
          setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            displayName: username,
            username: username,
            avatarURL: `https://i.pravatar.cc/150?u=${user.uid}`,
            xp: 0,
            winStreak: 0,
            trainingStreak: 0,
            homeCourt: 'Not Set',
            city: "Unknown"
          })
        ]);

        toast({ title: 'Account created!', description: 'Welcome to M2DG.' });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Logged in!', description: "Welcome back." });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4">
      <main className="w-full max-w-sm mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline text-gold">🏀 M2DG</h1>
            <p className="text-white/60">United by passion. Energized by the grind.</p>
        </div>
        <div className="bg-card p-6 rounded-card border border-white/10 space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="baller@example.com"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div>
                <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Button onClick={() => handleAuthAction('login')} className="w-full" variant="primary" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Log In'}
              </Button>
              <Button onClick={() => handleAuthAction('signup')} variant="outline" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
        </div>
      </main>
    </div>
  );
}
