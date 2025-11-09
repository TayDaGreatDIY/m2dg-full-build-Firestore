
'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc, updateDoc, increment, getDoc, Timestamp, writeBatch, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { courts as staticCourts } from '@/lib/courtData';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, LocateFixed, WifiOff, CheckCircle, RefreshCw, ShieldAlert, Badge } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Court, User as AppUser, CheckIn } from '@/lib/types';


const MAX_ACCEPTABLE_ACCURACY = 80; // meters
const MIN_SAMPLES = 3; 
const EXTRA_RADIUS_MARGIN = 100; // meters

type PositionSample = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

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
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [positionSamples, setPositionSamples] = useState<PositionSample[]>([]);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const watchIdRef = useRef<number | null>(null);

  // Load court details from static data
  useEffect(() => {
    const found = staticCourts.find((c) => c.id === courtId);
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

  const startWatchingPosition = () => {
    setLocationStatus('loading');
    setLocationError(null);
    setPositionSamples([]);
    setCurrentAccuracy(null);

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
        
        setCurrentAccuracy(accuracy);
        
        if (accuracy <= MAX_ACCEPTABLE_ACCURACY) {
          setPositionSamples(prev => [...prev, {latitude, longitude, accuracy, timestamp: pos.timestamp}].slice(-10)); // Keep last 10
        }

        const dist = getDistanceFromLatLonInMeters(
          latitude,
          longitude,
          court.latitude,
          court.longitude
        );

        setDistance(dist);
        setIsWithinRadius(dist <= (court.radius ?? 400) + EXTRA_RADIUS_MARGIN);
        
        if (accuracy > 100) {
            setLocationStatus('error');
            setLocationError('Weak GPS signal. Try moving to a more open area.');
        } else {
            setLocationStatus('success');
            setLocationError(null);
        }
      },
      (err) => {
        console.error("GPS Error:", err);
        let message = "Could not get location. Please enable GPS and allow location access.";
        if (err.code === err.PERMISSION_DENIED) {
            message = "Precise location access is required. Please enable it in your browser settings.";
        }
        setLocationError(message);
        setLocationStatus('error');
        toast({
            variant: 'destructive',
            title: 'GPS Error',
            description: message
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };
  
  // Start watching on mount
  useEffect(() => {
    startWatchingPosition();
    
    // Cleanup on component unmount
    return () => {
        if(watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [court]);


  // 🕓 Prevent abuse: cooldown check
  const canCheckIn = useMemo(() => {
    if (!lastCheckInTime) return true;
    const now = new Date();
    const last = lastCheckInTime.toDate();
    const diffHours = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
    return diffHours >= 2;
  }, [lastCheckInTime]);

  // Check if enough valid samples are collected
  const hasEnoughSamples = positionSamples.length >= MIN_SAMPLES;

  // ✅ Handle check-in
  const handleCheckIn = async () => {
    if (!authUser || !firestore || !court) {
      toast({ variant: 'destructive', title: 'You must be logged in to check in.' });
      return;
    }
    if (!isWithinRadius || !hasEnoughSamples) {
      toast({ variant: 'destructive', title: 'Could not verify location', description: 'Move closer to the court and ensure a stable GPS signal.' });
      return;
    }
    if (!canCheckIn) {
      toast({ variant: 'destructive', title: 'Cooldown Active', description: 'You can only check in once every 2 hours.' });
      return;
    }

    setIsCheckingIn(true);
    try {
        const checkinFunctionUrl = 'https://checkin-qhmdrry7ca-uc.a.run.app';

        const response = await fetch(checkinFunctionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: authUser.uid,
                courtId: court.id,
                samples: positionSamples,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Check-in validation failed.');
        }

        const newCheckInTimestamp = Timestamp.now();
        setLastCheckInTime(newCheckInTimestamp);

        toast({ 
            title: "✅ Checked in!", 
            description: `+25 XP earned at ${court?.name}. ${result.message || ''}`,
            className: "bg-green-600/20 border-green-500/50 text-white"
        });

    } catch (error: any) {
      console.error('Check-in failed:', error);
      toast({ variant: 'destructive', title: 'Check-in Failed', description: error.message || 'Please try again.' });
    } finally {
        setIsCheckingIn(false);
    }
  };

  // 🧮 Haversine formula
  function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
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
    const readyForCheckin = isWithinRadius && hasEnoughSamples && canCheckIn;
    let buttonText = "📍 Move Closer to Check In";
    if (isCheckingIn) buttonText = "Verifying...";
    else if (!hasEnoughSamples) buttonText = `Acquiring signal (${positionSamples.length}/${MIN_SAMPLES})...`;
    else if (!canCheckIn) buttonText = "Cooldown Active";
    else if (isWithinRadius) buttonText = "✅ Check In & Earn XP";


    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm text-white/50">Your distance</p>
                <p className="text-4xl font-bold font-headline">
                    {distance !== null ? Math.round(distance) : '---'}
                    <span className="text-2xl text-white/60">m</span>
                </p>
                 {isWithinRadius && hasEnoughSamples && <Badge variant="gold" className="mt-1">Within range</Badge>}
                 {!isWithinRadius && hasEnoughSamples && <Badge variant="destructive" className="mt-1">Too far</Badge>}
            </div>

            <Button
                onClick={handleCheckIn}
                disabled={!readyForCheckin || isCheckingIn}
                size="lg"
                className={`w-full font-bold transition-all text-base ${
                    readyForCheckin
                    ? 'bg-green-600 text-white hover:bg-green-500'
                    : 'bg-muted text-white/50 cursor-not-allowed'
                }`}
            >
                {isCheckingIn ? <Loader2 className="animate-spin" /> : (readyForCheckin ? <CheckCircle size={20}/> : <LocateFixed size={20}/>)}
                {buttonText}
            </Button>

            <Button onClick={startWatchingPosition} variant="outline" size="sm" className="w-full">
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

       <div className="max-w-md mx-auto mt-4 p-2 bg-black/20 rounded-md text-xs text-white/40 font-mono">
            <p>Debug Info:</p>
            <p>Accuracy: {currentAccuracy ? `${currentAccuracy.toFixed(2)}m` : 'N/A'}</p>
            <p>Samples: {positionSamples.length}/{MIN_SAMPLES}</p>
            <p>Coords: {positionSamples.length > 0 ? `${positionSamples.at(-1)?.latitude.toFixed(4)}, ${positionSamples.at(-1)?.longitude.toFixed(4)}` : 'N/A'}</p>
       </div>
    </div>
  );
}


    