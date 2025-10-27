
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, writeBatch, getDoc, collection } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

// One-time function to seed initial court data
const seedInitialCourts = async (db: any) => {
    // Check if courts have already been seeded to prevent re-running
    const checkDocRef = doc(db, "courts", "rucker-park-nyc");
    const checkDocSnap = await getDoc(checkDocRef);
    if (checkDocSnap.exists()) {
        console.log("Courts have already been seeded.");
        return;
    }

    const batch = writeBatch(db);
    const courts = [
        { id: 'rucker-park-nyc', name: 'Rucker Park', city: 'New York, NY', statusTag: 'Legendary Runs', img: 'https://images.unsplash.com/photo-1563302905-4830598613c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxiYXNrZXRiYWxsJTIwY291cnR8ZW58MHx8fHwxNzYxNDA3NTIzfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'venice-beach-la', name: 'Venice Beach', city: 'Los Angeles, CA', statusTag: 'Always Busy', img: 'https://images.unsplash.com/photo-1704394826018-41f849b6a516?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxiZWFjaCUyMGJhc2tldGJhbGx8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'the-cage-nyc', name: 'The Cage', city: 'New York, NY', statusTag: 'Runs Tonight', img: 'https://images.unsplash.com/photo-1618050989131-b62b57da4528?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxjaXR5JTIwY291cnR8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'dyckman-park-nyc', name: 'Dyckman Park', city: 'New York, NY', statusTag: 'Check for Runs', img: 'https://images.unsplash.com/photo-1698036935244-8315aa4597a4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxwYXJrJTIwY291cnR8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'kingdome-nyc', name: 'Kingdome', city: 'New York, NY', statusTag: 'Pro-Am Games', img: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxiYXNrZXRiYWxsJTIwdG91cm5hbWVudHxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'goat-park-nyc', name: 'Goat Park', city: 'New York, NY', statusTag: 'Pickup at 5pm', img: 'https://images.unsplash.com/photo-1645109498343-92eecf4ce600?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHx1cmJhbiUyMGJhc2tldGJhbGx8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'central-park-great-lawn-nyc', name: 'Central Park (Great Lawn)', city: 'New York, NY', statusTag: 'Casual Hoops', img: 'https://images.unsplash.com/photo-1758798459892-73ec6b42e930?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxwYXJrJTIwYmFza2V0YmFsbHxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'angels-gate-park-la', name: 'Angels Gate Park', city: 'Los Angeles, CA', statusTag: 'Scenic Views', img: 'https://images.unsplash.com/photo-1576001397459-fd0afe908bbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxvY2VhbiUyMHZpZXd8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'riverbank-state-park-nyc', name: 'Riverbank State Park', city: 'New York, NY', statusTag: 'Multiple Courts', img: 'https://images.unsplash.com/photo-1700206837885-2e740daf5f3c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxyaXZlcnNpZGUlMjBwYXJrfGVufDB8fHx8MTc2MTUyNDk2MXww&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'cloverdale-baltimore', name: 'Cloverdale', city: 'Baltimore, MD', statusTag: 'Historic Court', img: 'https://images.unsplash.com/photo-1684184667548-232acca8fb31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxiYXNrZXRiYWxsJTIwaGlzdG9yeXxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'seventeenth-street-rooftop-court-denver', name: '17th St Rooftop', city: 'Denver, CO', statusTag: 'Rooftop Ball', img: 'https://images.unsplash.com/photo-1758635957744-6ad5f3e2f7fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxyb29mdG9wJTIwY291cnR8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'mclaughlin-park-brooklyn', name: 'McLaughlin Park', city: 'Brooklyn, NY', statusTag: 'Neighborhood Gem', img: 'https://images.unsplash.com/photo-1561917443-6c5a9a4fca6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxicm9va2x5biUyMGNvdXJ0fGVufDB8fHx8MTc2MTUyNDk2MXww&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'flamingo-park-miami', name: 'Flamingo Park', city: 'Miami Beach, FL', statusTag: 'Bright & Busy', img: 'https://images.unsplash.com/photo-1627772561420-db532d787f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxtaWFtaSUyMGJhc2tldGJhbGx8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'santee-rooftop-court-la', name: 'Santee Rooftop', city: 'Los Angeles, CA', statusTag: 'Downtown Views', img: 'https://images.unsplash.com/photo-1662749344389-128a12032af3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxkb3dudG93biUyMGNvdXJ0fGVufDB8fHx8MTc2MTUyNDk2MXww&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'root-memorial-park-houston', name: 'Root Memorial Park', city: 'Houston, TX', statusTag: 'Downtown Hoops', img: 'https://images.unsplash.com/photo-1592281175375-a73f0a55127f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8Y2l0eSUyMHBhcmt8ZW58MHx8fHwxNzYxNTI0NzQ0fDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'central-park-atlanta', name: 'Central Park', city: 'Atlanta, GA', statusTag: 'City Vibes', img: 'https://images.unsplash.com/photo-1680646237981-f37a2a444bff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8YXRsYW50YSUyMHBhcmt8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'green-lake-park-seattle', name: 'Green Lake Park', city: 'Seattle, WA', statusTag: 'Lake Views', img: 'https://images.unsplash.com/photo-1701637342541-6734100cb333?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxsYWtlJTIwcGFya3xlbnwwfHx8fDE3NjE0OTcxNjV8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'centre-market-rooftop-court-nyc', name: 'Centre Market Rooftop', city: 'New York, NY', statusTag: 'Hidden Gem', img: 'https://images.unsplash.com/photo-1651827684357-a4585e524dd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxyb29mdG9wJTIwZ2FtZXxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'midway-park-myrtle-beach', name: 'Midway Park', city: 'Myrtle Beach, SC', statusTag: 'Beach Ball', img: 'https://images.unsplash.com/photo-1602303944883-c36bca04da9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxiZWFjaCUyMHBhcmt8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: '16th-susquehanna-philadelphia', name: '16th & Susquehanna', city: 'Philadelphia, PA', statusTag: 'Philly Streetball', img: 'https://images.unsplash.com/photo-1574390860064-23ba102ba739?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxwaGlsbHklMjBzdHJlZXRiYWxsfGVufDB8fHx8MTc2MTUyNDk2MXww&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'halle-park-memphis', name: 'Halle Park', city: 'Memphis, TN', statusTag: 'Local Hangout', img: 'https://images.unsplash.com/photo-1713776826197-7bfaec18306c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8bWVtcGhpcyUyMGJhc2tldGJhbGx8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'south-beach-park-fort-lauderdale', name: 'South Beach Park', city: 'Fort Lauderdale, FL', statusTag: 'Oceanfront', img: 'https://images.unsplash.com/photo-1648869733662-03bd7e807ec8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxiZWFjaHNpZGUlMjBjb3VydHxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'raymond-bush-playground-brooklyn', name: 'Raymond Bush Playground', city: 'Brooklyn, NY', statusTag: 'Community Hub', img: 'https://images.unsplash.com/photo-1709552899537-8f0a171aaf40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxwbGF5Z3JvdW5kJTIwY291cnR8ZW58MHx8fHwxNzYxNTI0OTYxfDA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'rockefeller-park-nyc', name: 'Rockefeller Park', city: 'New York, NY', statusTag: 'Downtown Views', img: 'https://images.unsplash.com/photo-1672505227395-64ad142ecb10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxtYW5oYXR0YW4lMjBjb3VydHxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'sunset-park-las-vegas', name: 'Sunset Park', city: 'Las Vegas, NV', statusTag: 'Vegas Hoops', img: 'https://images.unsplash.com/photo-1587223043646-fa771d9e0c8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxsYXMlMjB2ZWdhc3xlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'riverside-park-nyc', name: 'Riverside Park', city: 'New York, NY', statusTag: 'Hudson River Views', img: 'https://images.unsplash.com/photo-1604579230277-ad930b24a9a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxodWRzb24lMjByaXZlcnxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'jackson-park-chicago', name: 'Jackson Park', city: 'Chicago, IL', statusTag: 'Historic Park', img: 'https://images.unsplash.com/photo-1702401668035-5db091fb0c20?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxjaGljYWdvJTIwcGFya3xlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'the-dome-baltimore', name: 'The Dome', city: 'Baltimore, MD', statusTag: 'Legendary Streetball', img: 'https://images.unsplash.com/photo-1676553849790-1709f9aaab40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxiYWx0aW1vcmUlMjBzdHJlZXRiYWxsfGVufDB8fHx8MTc2MTUyNDk2MXww&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'lincoln-park-chicago', name: 'Lincoln Park', city: 'Chicago, IL', statusTag: 'City Views', img: 'https://images.unsplash.com/photo-1631548637245-043803a8b776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjaGljYWdvJTIwc2t5bGluZXxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
        { id: 'memorial-park-gym-santa-monica', name: 'Memorial Park Gym', city: 'Santa Monica, CA', statusTag: 'Indoor Runs', img: 'https://images.unsplash.com/photo-1696035110775-1942336ec1dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxneW0lMjBjb3VydHxlbnwwfHx8fDE3NjE1MjQ5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080' },
    ];

    courts.forEach(court => {
        const courtRef = doc(db, "courts", court.id);
        batch.set(courtRef, court);
    });

    try {
        await batch.commit();
        console.log("Initial courts seeded successfully.");
    } catch (error) {
        console.warn("Court seeding failed (this may be expected if data already exists):", error);
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

    