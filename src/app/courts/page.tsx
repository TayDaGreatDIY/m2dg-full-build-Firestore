
"use client";

import { useEffect, useState, useMemo } from "react";
import { DesktopHeader } from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from "@/firebase";
import type { Court } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, doc, getDoc, setDoc, query } from "firebase/firestore";
import { courtData } from "@/lib/courtData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

/* -------------------------------
   Ensure test court exists
-------------------------------- */
const ensureTestCourtExists = async (db: any) => {
  if (!db) return;
  const testCourtId = "home-test-court";
  const testCourtRef = doc(db, "courts", testCourtId);
  const testCourtSnap = await getDoc(testCourtRef);

  if (testCourtSnap.exists()) {
    console.log("✅ Test court already exists.");
    return;
  }

  console.log("🏀 Seeding home test court to Firestore...");
  const testCourt = courtData.find((c) => c.id === testCourtId);
  if (testCourt) {
    try {
      await setDoc(testCourtRef, testCourt);
      console.log("✅ Home Test Court seeded successfully.");
    } catch (error) {
      console.error("❌ Error seeding test court:", error);
    }
  }
};

/* -------------------------------
   Main Courts Page
-------------------------------- */
export default function CourtsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [selectedCity, setSelectedCity] = useState("All Cities");

  // Ensure court seeding runs only once
  useEffect(() => {
    if (firestore) ensureTestCourtExists(firestore);
  }, [firestore]);

  /* -------------------------------
     Courts Query (safe null handling)
  -------------------------------- */
  const courtsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user) return null; // Wait until ready
    return query(collection(firestore, "courts"));
  }, [firestore, user, isUserLoading]);

  const {
    data: courts,
    isLoading: areCourtsLoading,
    error,
  } = useCollection<Court>(courtsQuery);

  /* -------------------------------
     City Filter Logic
  -------------------------------- */
  const cities = useMemo(() => {
    if (!courts) return ["All Cities"];
    const uniqueCities = new Set(courts.map((c) => c.city).sort());
    return ["All Cities", ...Array.from(uniqueCities)];
  }, [courts]);

  const filteredCourts = useMemo(() => {
    if (!courts) return [];
    return courts.filter(
      (court) => selectedCity === "All Cities" || court.city === selectedCity
    );
  }, [courts, selectedCity]);

  const isLoading = isUserLoading || areCourtsLoading;

  if (error) {
    console.error("🔥 Firestore error fetching courts:", error);
  }

  /* -------------------------------
     Render Page
  -------------------------------- */
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Courts" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold font-headline tracking-tight">
              Find a Court
            </h2>
            <p className="text-sm text-white/50">
              Discover courts and runs in your city.
            </p>
          </div>

          <div className="flex gap-2">
            <Select
              onValueChange={setSelectedCity}
              value={selectedCity}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center pt-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-10 text-destructive">
                <p>Could not load courts.</p>
                <p className="text-xs text-white/50">
                  Check console for details.
                </p>
              </div>
            ) : filteredCourts && filteredCourts.length > 0 ? (
              filteredCourts.map((court) => (
                <CourtCard key={court.id} court={court} />
              ))
            ) : (
              <div className="text-center py-10 text-white/50">
                <p>No courts found for the selected city.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
