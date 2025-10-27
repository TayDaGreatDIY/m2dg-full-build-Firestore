
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
    { id: 'rucker-park-nyc', name: 'Rucker Park', city: 'New York, NY', statusTag: 'Legendary Runs', img: 'https://picsum.photos/seed/1/800/400' },
    { id: 'venice-beach-la', name: 'Venice Beach', city: 'Los Angeles, CA', statusTag: 'Always Busy', img: 'https://picsum.photos/seed/2/800/400' },
    { id: 'the-cage-nyc', name: 'The Cage', city: 'New York, NY', statusTag: 'Runs Tonight', img: 'https://picsum.photos/seed/3/800/400' },
    { id: 'dyckman-park-nyc', name: 'Dyckman Park', city: 'New York, NY', statusTag: 'Check for Runs', img: 'https://picsum.photos/seed/4/800/400' },
    { id: 'kingdome-nyc', name: 'Kingdome', city: 'New York, NY', statusTag: 'Pro-Am Games', img: 'https://picsum.photos/seed/5/800/400' },
    { id: 'goat-park-nyc', name: 'Goat Park', city: 'New York, NY', statusTag: 'Pickup at 5pm', img: 'https://picsum.photos/seed/6/800/400' },
    { id: 'central-park-great-lawn-nyc', name: 'Central Park (Great Lawn)', city: 'New York, NY', statusTag: 'Casual Hoops', img: 'https://picsum.photos/seed/7/800/400' },
    { id: 'angels-gate-park-la', name: 'Angels Gate Park', city: 'Los Angeles, CA', statusTag: 'Scenic Views', img: 'https://picsum.photos/seed/8/800/400' },
    { id: 'riverbank-state-park-nyc', name: 'Riverbank State Park', city: 'New York, NY', statusTag: 'Multiple Courts', img: 'https://picsum.photos/seed/9/800/400' },
    { id: 'cloverdale-baltimore', name: 'Cloverdale', city: 'Baltimore, MD', statusTag: 'Historic Court', img: 'https://picsum.photos/seed/10/800/400' },
    { id: 'seventeenth-street-rooftop-court-denver', name: '17th St Rooftop', city: 'Denver, CO', statusTag: 'Rooftop Ball', img: 'https://picsum.photos/seed/11/800/400' },
    { id: 'mclaughlin-park-brooklyn', name: 'McLaughlin Park', city: 'Brooklyn, NY', statusTag: 'Neighborhood Gem', img: 'https://picsum.photos/seed/12/800/400' },
    { id: 'flamingo-park-miami', name: 'Flamingo Park', city: 'Miami Beach, FL', statusTag: 'Bright & Busy', img: 'https://picsum.photos/seed/13/800/400' },
    { id: 'santee-rooftop-court-la', name: 'Santee Rooftop', city: 'Los Angeles, CA', statusTag: 'Downtown Views', img: 'https://picsum.photos/seed/14/800/400' },
    { id: 'root-memorial-park-houston', name: 'Root Memorial Park', city: 'Houston, TX', statusTag: 'Downtown Hoops', img: 'https://picsum.photos/seed/15/800/400' },
    { id: 'central-park-atlanta', name: 'Central Park', city: 'Atlanta, GA', statusTag: 'City Vibes', img: 'https://picsum.photos/seed/16/800/400' },
    { id: 'green-lake-park-seattle', name: 'Green Lake Park', city: 'Seattle, WA', statusTag: 'Lake Views', img: 'https://picsum.photos/seed/17/800/400' },
    { id: 'centre-market-rooftop-court-nyc', name: 'Centre Market Rooftop', city: 'New York, NY', statusTag: 'Hidden Gem', img: 'https://picsum.photos/seed/18/800/400' },
    { id: 'midway-park-myrtle-beach', name: 'Midway Park', city: 'Myrtle Beach, SC', statusTag: 'Beach Ball', img: 'https://picsum.photos/seed/19/800/400' },
    { id: '16th-susquehanna-philadelphia', name: '16th & Susquehanna', city: 'Philadelphia, PA', statusTag: 'Philly Streetball', img: 'https://picsum.photos/seed/20/800/400' },
    { id: 'halle-park-memphis', name: 'Halle Park', city: 'Memphis, TN', statusTag: 'Local Hangout', img: 'https://picsum.photos/seed/21/800/400' },
    { id: 'south-beach-park-fort-lauderdale', name: 'South Beach Park', city: 'Fort Lauderdale, FL', statusTag: 'Oceanfront', img: 'https://picsum.photos/seed/22/800/400' },
    { id: 'raymond-bush-playground-brooklyn', name: 'Raymond Bush Playground', city: 'Brooklyn, NY', statusTag: 'Community Hub', img: 'https://picsum.photos/seed/23/800/400' },
    { id: 'rockefeller-park-nyc', name: 'Rockefeller Park', city: 'New York, NY', statusTag: 'Downtown Views', img: 'https://picsum.photos/seed/24/800/400' },
    { id: 'sunset-park-las-vegas', name: 'Sunset Park', city: 'Las Vegas, NV', statusTag: 'Vegas Hoops', img: 'https://picsum.photos/seed/25/800/400' },
    { id: 'riverside-park-nyc', name: 'Riverside Park', city: 'New York, NY', statusTag: 'Hudson River Views', img: 'https://picsum.photos/seed/26/800/400' },
    { id: 'jackson-park-chicago', name: 'Jackson Park', city: 'Chicago, IL', statusTag: 'Historic Park', img: 'https://picsum.photos/seed/27/800/400' },
    { id: 'the-dome-baltimore', name: 'The Dome', city: 'Baltimore, MD', statusTag: 'Legendary Streetball', img: 'https://picsum.photos/seed/28/800/400' },
    { id: 'lincoln-park-chicago', name: 'Lincoln Park', city: 'Chicago, IL', statusTag: 'City Views', img: 'https://picsum.photos/seed/29/800/400' },
    { id: 'memorial-park-gym-santa-monica', name: 'Memorial Park Gym', city: 'Santa Monica, CA', statusTag: 'Indoor Runs', img: 'https://picsum.photos/seed/30/800/400' },
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
