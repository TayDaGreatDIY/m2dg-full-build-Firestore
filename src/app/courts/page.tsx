
"use client";

import { useEffect, useState, useMemo } from "react";
import { DesktopHeader } from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { Court } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, writeBatch, getDocs, limit, query } from "firebase/firestore";
import { courtData } from "@/lib/courtData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

// This function is intended for development setup to ensure courts exist.
// It checks if courts exist and seeds them only if the collection is empty.
const seedInitialCourts = async (db: any) => {
  const courtsCollectionRef = collection(db, "courts");
  // Check if there are any documents already
  const q = query(courtsCollectionRef, limit(1));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    console.log("Courts collection is not empty, seeding skipped.");
    return;
  }
  
  console.log("Seeding initial courts to Firestore...");
  const batch = writeBatch(db);
  
  courtData.forEach(court => {
      const courtRef = doc(db, "courts", court.id);
      const courtWithAddress = {
        ...court,
        address: court.address || `${court.name}, ${court.city}`
      }
      batch.set(courtRef, courtWithAddress, { merge: true });
  });

  try {
      await batch.commit();
      console.log("Courts seeded successfully.");
  } catch (error) {
      console.error("Error seeding courts:", error);
  }
};

export default function CourtsPage() {
  const firestore = useFirestore();
  const [selectedCity, setSelectedCity] = useState("All Cities");

  // Run the seeding logic once when the component mounts if firestore is available
  useEffect(() => {
    if (firestore) {
      // We are not awaiting this, it's a fire-and-forget for setup.
      seedInitialCourts(firestore);
    }
  }, [firestore]);

  const courtsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'courts');
  }, [firestore]);

  const { data: courts, isLoading, error } = useCollection<Court>(courtsQuery);
  
  const cities = useMemo(() => {
    if (!courts) return ["All Cities"];
    const uniqueCities = new Set(courts.map(c => c.city).sort());
    return ["All Cities", ...Array.from(uniqueCities)];
  }, [courts]);

  const filteredCourts = useMemo(() => {
    if (!courts) return [];
    return courts.filter(court => 
      selectedCity === "All Cities" || court.city === selectedCity
    );
  }, [courts, selectedCity]);

  if (error) {
    console.error("Firestore error fetching courts:", error);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Courts" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-headline tracking-tight">Find a Court</h2>
              <p className="text-sm text-white/50">Discover courts and runs in your city.</p>
          </div>
          
          <div className="flex gap-2">
            <Select onValueChange={setSelectedCity} value={selectedCity}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : error ? (
               <div className="text-center py-10 text-destructive">
                <p>Could not load courts.</p>
                <p className="text-xs text-white/50">Check console for details.</p>
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
