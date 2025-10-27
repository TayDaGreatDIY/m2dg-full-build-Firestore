
"use client";

import { useEffect } from "react";
import { DesktopHeader } from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase";
import type { Court } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, writeBatch, getDocs, doc, limit, query } from "firebase/firestore";
import { courtData } from "@/lib/courtData";

const seedInitialCourts = async (db: any) => {
    console.log("Checking if courts need to be seeded...");
    // More robust check: see if the collection is empty.
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

  useEffect(() => {
    if (firestore) {
      seedInitialCourts(firestore);
    }
  }, [firestore]);

  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading } = useCollection<Court>(courtsQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Courts" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-headline tracking-tight">Find a Court</h2>
              <p className="text-sm text-white/50">Your city • pickup • atmosphere rating (soon)</p>
          </div>

          <Button variant="primary" className="w-full">Host a Run</Button>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </>
            ) : courts && courts.length > 0 ? (
              courts.map((court) => (
                <CourtCard key={court.id} court={court} />
              ))
            ) : (
              <div className="text-center py-10 text-white/50">
                <p>No courts found. Data might be seeding.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
