
"use client";

import { useEffect, useState } from "react";
import { DesktopHeader } from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase";
import type { Court } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, writeBatch, getDocs, doc, limit, query, setDoc } from "firebase/firestore";
import { courtData } from "@/lib/courtData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";


const seedInitialCourts = async (db: any) => {
    console.log("Syncing courts with Firestore...");
    const batch = writeBatch(db);
    
    courtData.forEach(court => {
        const courtRef = doc(db, "courts", court.id);
        const courtWithAddress = {
          ...court,
          address: court.address || `${court.name}, ${court.city}` // Fallback address
        }
        // Use set with merge to add new courts or update existing ones without overwriting.
        // For a full sync, you could use batch.set() without merge.
        batch.set(courtRef, courtWithAddress, { merge: true });
    });

    try {
        await batch.commit();
        console.log("Courts synced successfully.");
    } catch (error) {
        console.error("Error syncing courts:", error);
    }
};

export default function CourtsPage() {
  const firestore = useFirestore();
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("All Cities");

  useEffect(() => {
    if (firestore) {
      seedInitialCourts(firestore);
    }
  }, [firestore]);

  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading } = useCollection<Court>(courtsQuery);

  const cities = ["All Cities", ...Array.from(new Set(courts?.map(c => c.city).sort() || []))];

  const filteredCourts = courts?.filter(court => 
    selectedCity === "All Cities" || court.city === selectedCity
  );

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
