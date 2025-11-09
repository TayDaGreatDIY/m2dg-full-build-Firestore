
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  useUser,
  useDoc,
  useCollection,
  useMemoFirebase,
  useFirestore,
} from "@/firebase";
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  where,
  getDocs,
} from "firebase/firestore";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/ui/UserAvatar";
import HostRunDialog from "@/components/courts/HostRunDialog";
import CheckInVerificationModal from "@/components/courts/CheckInVerificationModal";
import type { Court, CheckIn, Run, User } from "@/lib/types";
import {
  MapPin,
  Users,
  PlusCircle,
  LogOut,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import { handleCheckInXPAndStreak } from "@/lib/xpSystem";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

/* --------------------------
   Helper – Calculate distance
----------------------------- */
const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
};

export default function CourtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courtId = params.courtId as string;
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [isHostRunOpen, setIsHostRunOpen] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  const CHECK_IN_RADIUS_METERS = 400; // ~0.25 miles

  /* --------------------------
     Court data
  ----------------------------- */
  const courtDocRef = useMemoFirebase(() => {
    if (!firestore || !courtId) return null;
    return doc(firestore, "courts", courtId);
  }, [firestore, courtId]);
  const { data: court, isLoading: isCourtLoading } = useDoc<Court>(courtDocRef);

  /* --------------------------
     Get user's location
  ----------------------------- */
  useEffect(() => {
    if (isMobile && court?.latitude && court?.longitude) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          const dist = getDistanceInMeters(
            latitude,
            longitude,
            court.latitude!,
            court.longitude!
          );
          setDistance(dist);
          setLocationError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError(
            "Location required to check in. Enable location services and try again."
          );
          setDistance(null);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [isMobile, court]);

  /* --------------------------
     Check-ins Query
  ----------------------------- */
  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore || !courtId) return null;
    return query(
      collection(firestore, "courts", courtId, "checkins"),
      orderBy("timestamp", "desc")
    );
  }, [firestore, courtId]);

  const { data: checkins, isLoading: areCheckinsLoading } = useCollection<CheckIn>(
    checkinsQuery
  );

  /* --------------------------
     Runs Query
  ----------------------------- */
  const runsQuery = useMemoFirebase(() => {
    if (!firestore || !courtId) return null;
    return query(
      collection(firestore, "courts", courtId, "runs"),
      orderBy("createdAt", "desc")
    );
  }, [firestore, courtId]);

  const { data: runs, isLoading: areRunsLoading } = useCollection<Run>(
    runsQuery
  );

  const isCheckedIn =
    currentUser && checkins?.some((c) => c.id === currentUser.uid);

  /* --------------------------
     Handle Check-In
  ----------------------------- */
  const handleCheckIn = async () => {
    if (!currentUser || !courtId || !firestore) return;

    if (distance === null || distance > CHECK_IN_RADIUS_METERS) {
      toast({
        variant: "destructive",
        title: "Too Far to Check In",
        description: `You must be within ${CHECK_IN_RADIUS_METERS} meters of the court.`,
      });
      return;
    }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentCheckinQuery = query(
      collection(firestore, "courts", courtId, "checkins"),
      where("userId", "==", currentUser.uid),
      where("timestamp", ">", twoHoursAgo)
    );
    const recentCheckinSnap = await getDocs(recentCheckinQuery);
    if (!recentCheckinSnap.empty) {
      toast({
        variant: "destructive",
        title: "Already Checked In",
        description: "You can only check in at this court once every 2 hours.",
      });
      return;
    }

    // Instead of direct check-in, open the verification modal
    setIsVerificationOpen(true);
    // In a real implementation, you would trigger the backend to send a code here.
    toast({ title: "Verification Required", description: "A code has been sent to your email." });
  };
  
  const handleVerifyAndCheckIn = async (code: string) => {
    if (!currentUser || !courtId || !firestore || !court) return;

    // --- Placeholder Logic ---
    // In a real app, you would call a Cloud Function here to verify the code.
    // For now, we'll simulate a successful verification if the code is '123456'.
    const isCodeValid = code === '123456';
    
    if (!isCodeValid) {
        toast({ variant: 'destructive', title: 'Invalid Code', description: 'The verification code is incorrect. Please try again.' });
        return;
    }
    // --- End Placeholder Logic ---

    const checkinRef = doc(
      firestore,
      "courts",
      courtId,
      "checkins",
      currentUser.uid
    );

    const userDocRef = doc(firestore, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      toast({
        variant: "destructive",
        title: "Check-in failed",
        description: "Could not find your user profile.",
      });
      return;
    }
    const userProfile = userDocSnap.data() as User;

    try {
      await setDoc(checkinRef, {
        userId: currentUser.uid,
        timestamp: serverTimestamp(),
        user: {
          uid: currentUser.uid,
          displayName: userProfile.displayName,
          avatarURL: userProfile.avatarURL,
        },
      });

      await handleCheckInXPAndStreak(firestore, userProfile);
      
      setIsVerificationOpen(false); // Close modal on success
      toast({
        title: "You're checked in!",
        description: `+25 XP! You are now checked in at ${court?.name}.`,
      });
    } catch (error) {
      console.error("Error checking in:", error);
      toast({ variant: "destructive", title: "Check-in failed" });
    }
  };


  /* --------------------------
     Handle Check-Out
  ----------------------------- */
  const handleCheckOut = async () => {
    if (!currentUser || !courtId || !firestore) return;
    const checkinRef = doc(firestore, "courts", courtId, "checkins", currentUser.uid);
    try {
      await deleteDoc(checkinRef);
      toast({ title: "You're checked out." });
    } catch (error) {
      console.error("Error checking out:", error);
      toast({ variant: "destructive", title: "Check-out failed" });
    }
  };

  /* --------------------------
     Loading & Error UI
  ----------------------------- */
  const isLoading = isCourtLoading || areCheckinsLoading || areRunsLoading;
  const canCheckIn = isMobile && distance !== null && distance <= CHECK_IN_RADIUS_METERS;

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

  /* --------------------------
     Alerts
  ----------------------------- */
  const getCheckInAlert = () => {
    if (!isMobile) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Desktop Browser Detected</AlertTitle>
          <AlertDescription>
            Check-ins are only available from your mobile device at the court.
          </AlertDescription>
        </Alert>
      );
    }
    if (locationError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Location Required</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      );
    }
    if (distance !== null && distance > CHECK_IN_RADIUS_METERS) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Too Far From Court</AlertTitle>
          <AlertDescription>
            The players don’t see you on the court. Don’t be scared to compete — show up and earn your XP!
            <span className="text-xs block text-white/50">
              (You are {Math.round(distance)}m away)
            </span>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
  };

  /* --------------------------
     Render Page
  ----------------------------- */
  return (
    <>
      <HostRunDialog
        isOpen={isHostRunOpen}
        onOpenChange={setIsHostRunOpen}
        courtId={courtId}
        courtName={court.name}
      />
      <CheckInVerificationModal
        isOpen={isVerificationOpen}
        onOpenChange={setIsVerificationOpen}
        onVerify={handleVerifyAndCheckIn}
        userEmail={currentUser?.email || ''}
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
            <Image
              src={court.img || "https://picsum.photos/seed/court/800/400"}
              alt={court.name}
              fill
              style={{ objectFit: "cover" }}
              className="opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="max-w-lg mx-auto w-full p-4 -mt-16 relative space-y-6">
            <div className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-lg">
              <Badge variant="gold" className="mb-2">
                {court.status}
              </Badge>
              <h1 className="text-2xl font-bold font-headline text-white">
                {court.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-white/60 mt-1">
                <MapPin size={14} />
                <p>{court.address}</p>
              </div>
              {distance !== null && (
                <p className="text-xs text-white/50 mt-2">
                  You are {Math.round(distance)} meters away
                </p>
              )}
            </div>

            <div className="space-y-2">
              {getCheckInAlert()}
              <div className="grid grid-cols-2 gap-2">
                {isCheckedIn ? (
                  <Button variant="outline" onClick={handleCheckOut}>
                    <LogOut size={16} />
                    Check Out
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleCheckIn}
                    disabled={!currentUser || !canCheckIn}
                  >
                    <Users size={16} />
                    Check In
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setIsHostRunOpen(true)}
                  disabled={!currentUser}
                >
                  <PlusCircle size={16} />
                  Host a Run
                </Button>
              </div>
            </div>

            {/* Who's Here */}
            <div className="bg-card p-4 rounded-xl border border-white/10">
              <h2 className="font-bold font-headline text-lg mb-3">
                Who's Here ({checkins?.length || 0})
              </h2>
              {checkins && checkins.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {checkins.map(
                    (c) =>
                      c.user && (
                        <UserAvatar
                          key={c.id}
                          src={c.user.avatarURL}
                          name={c.user.displayName || "Unknown"}
                          size={40}
                        />
                      )
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/50">
                  No one is checked in yet. Be the first!
                </p>
              )}
            </div>

            {/* Upcoming Runs */}
            <div className="bg-card p-4 rounded-xl border border-white/10">
              <h2 className="font-bold font-headline text-lg mb-3">
                Upcoming Runs ({runs?.length || 0})
              </h2>
              {runs && runs.length > 0 ? (
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      className="bg-background/50 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-orange">{run.time}</p>
                          <p className="text-sm text-white/60">
                            Hosted by @{run.hostName}
                          </p>
                        </div>
                        <p className="text-xs text-white/40">
                          {run.createdAt
                            ? format(run.createdAt.toDate(), "P")
                            : ""}
                        </p>
                      </div>
                      {run.note && (
                        <p className="text-sm text-white/90 mt-2 border-l-2 border-orange/20 pl-2">
                          {run.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">
                  No runs hosted yet. Start one!
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
