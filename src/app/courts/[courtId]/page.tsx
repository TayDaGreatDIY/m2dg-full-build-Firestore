
"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { db } from "@/firebase/config";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { courts } from "@/lib/courtData";
import { useUser } from '@/firebase';

type CourtType = (typeof courts)[0];

export default function CourtPage() {
  const params = useParams();
  const { courtId } = params;
  const [court, setCourt] = useState<CourtType | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null);
  const { user: authUser } = useUser();

  // 🧭 Load court details
  useEffect(() => {
    const found = courts.find((c) => c.id === courtId);
    if (found) {
        setCourt(found);
    }
  }, [courtId]);

  // Load user's last check-in time
  useEffect(() => {
    if (!authUser) return;
    const userRef = doc(db, "users", authUser.uid);
    getDoc(userRef).then(docSnap => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData.lastCheckInTime) {
                setLastCheckInTime(userData.lastCheckInTime);
            }
        }
    })
  }, [authUser]);

  // 🧭 Get user's GPS location
  useEffect(() => {
    if (!court) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        const dist = getDistanceFromLatLonInMeters(
          userLat,
          userLng,
          court.latitude,
          court.longitude
        );
        setDistance(dist);
        setIsWithinRadius(dist <= court.radius);
      },
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true }
    );
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
    if (!authUser) {
        alert("You must be logged in to check in.");
        return;
    }

    if (!isWithinRadius) {
      alert("Move closer to the court to check in.");
      return;
    }

    if (!canCheckIn()) {
      alert("You can only check in once every 2 hours.");
      return;
    }

    try {
      const userRef = doc(db, "users", authUser.uid);
      const newCheckInTime = new Date().toISOString();
      await updateDoc(userRef, {
        xp: increment(25),
        lastCheckInTime: newCheckInTime,
        currentCourtId: courtId,
      });
      setLastCheckInTime(newCheckInTime);
      alert(`✅ Checked in! +25 XP at ${court?.name}`);
    } catch (error) {
      console.error("Check-in failed:", error);
      alert("Check-in failed. Please try again.");
    }
  };

  // 🧮 Haversine formula (distance between 2 GPS points)
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

  return (
    <div className="p-6 text-white min-h-screen bg-background">
      {court ? (
        <div className="max-w-md mx-auto bg-card p-6 rounded-lg">
          <h1 className="text-2xl font-bold font-headline text-gold">{court.name}</h1>
          <p className="text-white/70">{court.address}</p>
          <p className="text-white/50 mt-2 text-sm">
            {distance ? `${Math.round(distance)} meters away` : "Calculating distance..."}
          </p>

          <button
            onClick={handleCheckIn}
            disabled={!isWithinRadius || !authUser}
            className={`mt-6 px-6 py-3 rounded-lg w-full font-bold transition-all ${
              isWithinRadius && authUser ? "bg-orange text-black hover:brightness-110" : "bg-muted text-white/50 cursor-not-allowed"
            }`}
          >
            {isWithinRadius ? "✅ Check In" : "📍 Move Closer to Check In"}
          </button>
          {!canCheckIn() && <p className="text-center text-sm text-yellow-400 mt-4">Cooldown active. You can check in again later.</p>}
        </div>
      ) : (
        <p>Loading court...</p>
      )}
    </div>
  );
}
