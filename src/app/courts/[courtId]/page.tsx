
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, setDoc, deleteDoc, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UserAvatar from '@/components/ui/UserAvatar';
import HostRunDialog from '@/components/courts/HostRunDialog';
import type { Court, CheckIn, Run, User } from '@/lib/types';
import { MapPin, Users, PlusCircle, LogOut, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.courtId as string;
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isHostRunOpen, setIsHostRunOpen] = useState(false);

  // Fetch court data
  const courtDocRef = useMemoFirebase(() => {
    if (!firestore || !courtId) return null;
    return doc(firestore, 'courts', courtId);
  }, [firestore, courtId]);
  const { data: court, isLoading: isCourtLoading } = useDoc<Court>(courtDocRef);

  // Fetch check-ins
  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore || !courtId) return null;
    // We get the user document along with the check-in to display avatar/name
    return collection(firestore, 'courts', courtId, 'checkins');
  }, [firestore, courtId]);
  const { data: checkins, isLoading: areCheckinsLoading } = useCollection<CheckIn>(checkinsQuery);

  // Fetch upcoming runs
  const runsQuery = useMemoFirebase(() => {
    if (!firestore || !courtId) return null;
    return query(collection(firestore, 'courts', courtId, 'runs'), orderBy('createdAt', 'desc'));
  }, [firestore, courtId]);
  const { data: runs, isLoading: areRunsLoading } = useCollection<Run>(runsQuery);
  
  const isCheckedIn = currentUser && checkins?.some(c => c.id === currentUser.uid);

  const handleCheckIn = async () => {
    if (!currentUser || !courtId || !firestore) return;
    const checkinRef = doc(firestore, 'courts', courtId, 'checkins', currentUser.uid);
    
    // We need to fetch the current user's profile to store denormalized data
    const userDocSnap = await getDoc(doc(firestore, 'users', currentUser.uid));
    if (!userDocSnap.exists()) {
        toast({ variant: 'destructive', title: "Check-in failed", description: "Could not find your user profile." });
        return;
    }
    const userProfile = userDocSnap.data() as User;

    try {
      await setDoc(checkinRef, {
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        user: { // Denormalizing user data for display
            uid: currentUser.uid,
            displayName: userProfile.displayName,
            avatarURL: userProfile.avatarURL,
        }
      });
      toast({ title: "You're checked in!", description: `You are now checked in at ${court?.name}.` });
    } catch (error) {
      console.error("Error checking in:", error);
      toast({ variant: 'destructive', title: "Check-in failed" });
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser || !courtId || !firestore) return;
    const checkinRef = doc(firestore, 'courts', courtId, 'checkins', currentUser.uid);
    try {
      await deleteDoc(checkinRef);
      toast({ title: "You're checked out." });
    } catch (error) {
      console.error("Error checking out:", error);
      toast({ variant: 'destructive', title: "Check-out failed" });
    }
  };


  const isLoading = isCourtLoading || areCheckinsLoading || areRunsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center gap-4 p-3 border-b border-white/10 bg-background">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft size={20} />
            </Button>
            <h1 className="font-bold font-headline">Loading...</h1>
        </header>
        <main className="flex-1 max-w-lg mx-auto w-full p-4 space-y-6">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <div className="space-y-4">
             <Skeleton className="h-20 w-full" />
             <Skeleton className="h-20 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="flex items-center gap-4 p-3 border-b border-white/10 bg-background">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/courts">
                    <ChevronLeft size={20} />
                </Link>
            </Button>
            <h1 className="font-bold font-headline">Court Not Found</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p>Court not found.</p>
        </main>
      </div>
    );
  }

  return (
    <>
      <HostRunDialog
          isOpen={isHostRunOpen}
          onOpenChange={setIsHostRunOpen}
          courtId={courtId}
          courtName={court.name}
      />
      <div className="flex flex-col min-h-screen bg-background">
        <header className="flex items-center gap-4 p-3 border-b border-white/10 bg-background sticky top-0 z-20">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ChevronLeft size={20} />
            </Button>
            <h1 className="font-bold font-headline truncate">{court.name}</h1>
        </header>
        <main className="flex-1 pb-24">
          <div className="relative h-48 w-full">
              <Image src={court.img || 'https://picsum.photos/seed/court/800/400'} alt={court.name} fill style={{ objectFit: 'cover' }} className="opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="max-w-lg mx-auto w-full p-4 -mt-16 relative space-y-6">
              <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-lg">
                  <Badge variant="gold" className="mb-2">{court.status}</Badge>
                  <h1 className="text-2xl font-bold font-headline text-white">{court.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                      <MapPin size={14} />
                      <p>{court.address}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                  {isCheckedIn ? (
                       <Button variant="outline" onClick={handleCheckOut}>
                          <LogOut size={16}/>
                          Check Out
                      </Button>
                  ) : (
                      <Button variant="primary" onClick={handleCheckIn} disabled={!currentUser}>
                          <Users size={16}/>
                          Check In
                      </Button>
                  )}
                  <Button variant="secondary" onClick={() => setIsHostRunOpen(true)} disabled={!currentUser}>
                     <PlusCircle size={16}/>
                     Host a Run
                  </Button>
              </div>

              <div className="bg-card p-4 rounded-xl border border-white/10">
                  <h2 className="font-bold font-headline text-lg mb-3">Who's Here ({checkins?.length || 0})</h2>
                  {checkins && checkins.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                          {checkins.map(c => (
                            c.user ? (
                              <UserAvatar 
                                  key={c.id} 
                                  src={c.user.avatarURL} 
                                  name={c.user.displayName || 'Unknown'} 
                                  size={40}
                              />
                            ) : null
                          ))}
                      </div>
                  ) : (
                      <p className="text-sm text-white/50">No one is checked in yet. Be the first!</p>
                  )}
              </div>
              
              <div className="bg-card p-4 rounded-xl border border-white/10">
                  <h2 className="font-bold font-headline text-lg mb-3">Upcoming Runs ({runs?.length || 0})</h2>
                   {runs && runs.length > 0 ? (
                      <div className="space-y-3">
                          {runs.map(run => (
                              <div key={run.id} className="bg-background/50 p-3 rounded-lg">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <p className="font-bold text-orange">{run.time}</p>
                                          <p className="text-sm text-white/60">Hosted by @{run.hostName}</p>
                                      </div>
                                      <p className="text-xs text-white/40">{run.createdAt ? format(run.createdAt.toDate(), 'P') : ''}</p>
                                  </div>
                                  {run.note && <p className="text-sm text-white/90 mt-2 border-l-2 border-orange/20 pl-2">{run.note}</p>}
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-sm text-white/50">No runs hosted yet. Start one!</p>
                  )}
              </div>

          </div>
        </main>
      </div>
    </>
  );
}
