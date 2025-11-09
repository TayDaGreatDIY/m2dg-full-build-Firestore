'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { courts } from '@/lib/courtData';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CourtType = (typeof courts)[0];

export default function CourtPage() {
  const params = useParams();
  const { courtId } = params;
  const { toast } = useToast();

  const [court, setCourt] = useState<CourtType | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('loading');
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { user: authUser } = useUser();
  const firestore = useFirestore();

  // Load court details
  useEffect(() => {
    const found = courts.find((c) => c.id === courtId);
    setCourt(found || null);
  }, [courtId]);

  // Load user's last check-in time
  useEffect(() => {
    if (!authUser || !firestore) return;
    const userRef = doc(firestore, 'users', authUser.uid);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.lastCheckInTime) {
          setLastCheckInTime(userData.lastCheckInTime);
        }
      }
    });
  }, [authUser, firestore]);

  // 🚀 Auto-request location with high accuracy
  useEffect(() => {
    if (!court) return;

    setLocationStatus('loading');
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const dist = getDistanceFromLatLonInMeters(
          latitude,
          longitude,
          court.latitude,
          court.longitude
        );
        setDistance(dist);
        setIsWithinRadius(dist <= court.radius);
        setLocationStatus('success');
        setLocationError(null);
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocationError(err.message || "Could not get location. Please enable GPS and allow location access.");
        setLocationStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    // cleanup
    return () => navigator.geolocation.clearWatch(watchId);
  }, [court]);


  // 🕓 Prevent abuse: cooldown check
  const canCheckIn = () => {
    if (!lastCheckInTime) return true;
    const now = new Date();
    const last = new Date(lastCheckInTime);
    const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    return diffHours >= 2;
  };

  // ✅ Handle check-in
  const handleCheckIn = async () => {
    if (!authUser || !firestore) {
      toast({ variant: 'destructive', title: 'You must be logged in to check in.' });
      return;
    }

    if (!isWithinRadius) {
      toast({ variant: 'destructive', title: 'Move closer to the court to check in.' });
      return;
    }

    if (!canCheckIn()) {
      toast({ variant: 'destructive', title: 'Cooldown Active', description: 'You can only check in once every 2 hours.' });
      return;
    }

    try {
      const userRef = doc(firestore, 'users', authUser.uid);
      const newCheckInTime = new Date().toISOString();
      await updateDoc(userRef, {
        xp: increment(25),
        lastCheckInTime: newCheckInTime,
        currentCourtId: courtId,
      });
      setLastCheckInTime(newCheckInTime);
      toast({ title: "✅ Checked in!", description: `+25 XP earned at ${court?.name}` });
    } catch (error) {
      console.error('Check-in failed:', error);
      toast({ variant: 'destructive', title: 'Check-in Failed', description: 'Please try again.' });
    }
  };

  // 🧮 Haversine formula (distance between 2 GPS points)
  function getDistanceFromLatLonInMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371e3; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const renderContent = () => {
    if (!court) {
       return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    }
    
    if (locationStatus === 'loading') {
       return (
         <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-white/60">Getting your location...</p>
         </div>
       );
    }
    
    if (locationStatus === 'error') {
       return (
          <div className="text-center">
            <p className="text-red-400 text-sm">
                {locationError}
            </p>
          </div>
       );
    }

    return (
        <>
            <p className="text-white/50 mt-2 text-sm">
            {distance !== null
              ? `${Math.round(distance)} meters away`
              : 'Locating...'}
          </p>

          <Button
            onClick={handleCheckIn}
            disabled={!isWithinRadius || !authUser || !canCheckIn()}
            className={`mt-6 w-full font-bold transition-all ${
                isWithinRadius && authUser && canCheckIn()
                ? 'bg-orange text-black hover:brightness-110'
                : 'bg-muted text-white/50 cursor-not-allowed'
            }`}
            >
            {isWithinRadius ? '✅ Check In' : '📍 Move Closer to Check In'}
          </Button>

          {!canCheckIn() && (
            <p className="text-center text-sm text-yellow-400 mt-4">
              Cooldown active. You can check in again later.
            </p>
          )}
        </>
    );
  };


  return (
    <div className="p-6 text-white min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-card p-6 rounded-lg">
          {court ? (
               <>
                <h1 className="text-2xl font-bold font-headline text-gold">
                    {court.name}
                </h1>
                <p className="text-white/70">{court.address}</p>
                {renderContent()}
               </>
          ) : (
             <div className="flex justify-center items-center h-64">
                <p>Court not found.</p>
            </div>
          )}
      </div>
    </div>
  );
}
