
"use client";

import { useEffect, useState } from "react";
import { DesktopHeader } from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase";
import type { Court } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, writeBatch, getDocs, doc, limit, query } from "firebase/firestore";
import { courtData } from "@/lib/courtData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const seedInitialCourts = async (db: any) => {
    console.log("Checking if courts need to be seeded...");
    const courtsCollectionRef = collection(db, "courts");
    const q = query(courtsCollectionRef, limit(1));
    const initialCheck = await getDocs(q);
    
    if (!initialCheck.empty) {
        console.log("Courts collection is not empty. Seeding skipped.");
        return;
    }
    
    console.log("Seeding initial courts...");
    const batch = writeBatch(db);
    
    courtData.forEach(court => {
        const courtRef = doc(db, "courts", court.id);
        batch.set(courtRef, court);
    });

    try {
        await batch.commit();
        console.log("Initial courts seeded successfully.");
    } catch (error) {
        console.error("Error seeding courts:", error);
    }
};

export default function CourtsPage() {
  const firestore = useFirestore();
  const [selectedCity, setSelectedCity] = useState("All Cities");

  useEffect(() => {
    if (firestore) {
      seedInitialCourts(firestore);
    }
  }, [firestore]);

  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading } = useCollection<Court>(courtsQuery);

  const cities = ["All Cities", ...Array.from(new Set(courts?.map(c => c.city)))];

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
            <Button variant="primary" className="whitespace-nowrap">Host a Run</Button>
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
