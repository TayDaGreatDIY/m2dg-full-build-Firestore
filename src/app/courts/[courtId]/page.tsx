
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc, increment, getDoc, Timestamp } from 'firebase/firestore';
import { courts } from '@/lib/courtData';
import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, LocateFixed, WifiOff, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Court } from '@/lib/types';
import type { User as AppUser } from '@/lib/types';

export default function CourtPage() {
  const params = useParams();
  const { courtId } = params;
  const { toast } = useToast();

  const [court, setCourt] = useState<Court | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [lastCheckInTime, setLastCheckInTime] = useState<Timestamp | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const watchIdRef = useRef<number | null>(null);


  // Load court details from static data
  useEffect(() => {
    const found = courts.find((c) => c.id === courtId);
    setCourt(found || null);
  }, [courtId]);


  // Load user's last check-in time from Firestore
  useEffect(() => {
    if (!authUser || !firestore) return;
    const userRef = doc(firestore, 'users', authUser.uid);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as AppUser;
        if (userData.lastCheckIn) {
          setLastCheckInTime(userData.lastCheckIn);
        }
      }
    });
  }, [authUser, firestore]);
  
  // Check for geolocation permissions on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "geolocation" as PermissionName }).then((permissionStatus) => {
        if (permissionStatus.state === 'denied') {
          setLocationError("GPS permission denied. Please enable it in your browser settings.");
          setLocationStatus('error');
          toast({
            variant: "destructive",
            title: "GPS Permission Denied",
            description: "Please allow precise location access for check-ins.",
          });
        }
      });
    }
  }, [toast]);


  const startWatchingPosition = () => {
    setLocationStatus('loading');
    setLocationError(null);

    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    if (!court) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log("📍 GPS Update:", { latitude, longitude, accuracy });
        console.log("🎯 Court Coords:", { lat: court.latitude, lon: court.longitude });
        
        if (accuracy > 100) { // If accuracy is worse than 100 meters, signal is weak
            setLocationStatus('error');
            setLocationError('Weak GPS signal. Move to an open area.');
            return;
        }

        const dist = getDistanceFromLatLonInMeters(
          latitude,
          longitude,
          court.latitude,
          court.longitude
        );

        setDistance(dist);
        // Loosen radius for testing GPS drift
        setIsWithinRadius(dist <= (court.radius ?? 400) + 200);
        setLocationStatus('success');
        setLocationError(null);
      },
      (err) => {
        console.error("GPS Error:", err);
        setLocationError(err.message || "Could not get location. Please enable GPS and allow location access.");
        setLocationStatus('error');
        toast({
            variant: 'destructive',
            title: 'GPS Error',
            description: err.message
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
        if(watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
    }
  }, []);


  // 🕓 Prevent abuse: cooldown check
  const canCheckIn = () => {
    if (!lastCheckInTime) return true;
    const now = new Date();
    const last = lastCheckInTime.toDate();
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
      const newCheckInTimestamp = Timestamp.now();

      await updateDoc(userRef, {
        xp: increment(25),
        lastCheckIn: newCheckInTimestamp,
        currentCourtId: courtId,
      });

      setLastCheckInTime(newCheckInTimestamp);
      toast({ 
          title: "✅ Checked in!", 
          description: `+25 XP earned at ${court?.name}`,
          className: "bg-green-600/20 border-green-500/50 text-white"
      });
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
       return <div className="flex justify-center items-center h-64"><p>Court not found.</p></div>;
    }
    
    if (locationStatus === 'idle' && !locationError) {
        return (
            <div className='text-center space-y-4'>
                <p className='text-white/70'>Press the button to start GPS tracking for check-in.</p>
                <Button onClick={startWatchingPosition} size="lg" className='w-full'>
                    <LocateFixed size={20}/>
                    Get My Location
                </Button>
            </div>
        )
    }
    
    if (locationStatus === 'loading') {
       return (
         <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="animate-spin text-primary" size={32} />
            <p className="text-white/60">📍 Fetching GPS signal...</p>
         </div>
       );
    }
    
    if (locationStatus === 'error') {
       return (
          <div className="text-center bg-destructive/10 p-4 rounded-lg space-y-4">
             <WifiOff className="mx-auto text-destructive" size={24} />
            <p className="text-red-400 text-sm mt-2">
                {locationError}
            </p>
            <Button onClick={startWatchingPosition} variant="outline" size="sm">
                <RefreshCw size={14}/>
                Retry
            </Button>
          </div>
       );
    }

    // Success state
    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm text-white/50">Your distance</p>
                <p className="text-4xl font-bold font-headline">
                    {distance !== null ? Math.round(distance) : '---'}
                    <span className="text-2xl text-white/60">m</span>
                </p>
                 {isWithinRadius && <p className='text-green-400 text-sm font-bold'>✅ Within range</p>}
            </div>

            <Button
                onClick={handleCheckIn}
                disabled={!isWithinRadius || !authUser || !canCheckIn()}
                size="lg"
                className={`w-full font-bold transition-all text-base ${
                    isWithinRadius && authUser && canCheckIn()
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'bg-muted text-white/50 cursor-not-allowed'
                }`}
                >
                {isWithinRadius ? <CheckCircle size={20}/> : <LocateFixed size={20}/>}
                {isWithinRadius ? 'Check In & Earn XP' : 'Move Closer to Check In'}
            </Button>

            {!canCheckIn() && (
                <p className="text-center text-sm text-yellow-400 mt-2">
                Cooldown active. You can check in again later.
                </p>
            )}

            <Button onClick={startWatchingPosition} variant="outline" size="sm">
                <RefreshCw size={14} className={locationStatus === 'loading' ? 'animate-spin' : ''}/>
                Refresh My Location
            </Button>
        </div>
    );
  };


  return (
    <div className="p-6 text-white min-h-screen bg-background">
      <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-lg">
          {court ? (
               <>
                <h1 className="text-2xl font-bold font-headline text-gold text-center mb-1">
                    {court.name}
                </h1>
                <p className="text-white/70 text-center mb-6">{court.address}</p>
                {renderContent()}
               </>
          ) : (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}
      </div>
    </div>
  );
}
