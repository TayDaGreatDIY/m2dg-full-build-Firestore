"use client";

import { useMemo } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Court } from "@/lib/types";
import CourtCard from "@/components/courts/CourtCard";
import { DesktopHeader } from "@/components/ui/TopNav";

export default function CourtsPage() {
  const firestore = useFirestore();

  const courtsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "courts"), orderBy("name", "asc"));
  }, [firestore]);

  const { data: courts = [], isLoading } = useCollection<Court>(courtsQuery);

  return (
    <div className="flex flex-col min-h-screen">
       <DesktopHeader pageTitle="Find a Court" />
       <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-4">
            {isLoading ? (
              <p className="text-white text-center mt-10">Loading courts...</p>
            ) : (
                courts.map((court) => (
                    <CourtCard key={court.id} court={court} />
                ))
            )}
        </div>
      </main>
    </div>
  );
}
