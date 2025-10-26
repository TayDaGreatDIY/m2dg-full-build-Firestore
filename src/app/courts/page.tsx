"use client";

import TopNav from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import { Button } from "@/components/ui/button";
import { useCollection, useMemoFirebase } from "@/firebase";
import { useFirestore } from "@/firebase";
import type { Court } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { collection } from "firebase/firestore";

export default function CourtsPage() {
  const firestore = useFirestore();
  const courtsQuery = useMemoFirebase(() => collection(firestore, 'courts'), [firestore]);
  const { data: courts, isLoading } = useCollection<Court>(courtsQuery);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Courts" />

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
              <p>No courts found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}