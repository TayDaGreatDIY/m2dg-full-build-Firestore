
"use client";

import { useMemo, useState } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Court } from "@/lib/types";
import CourtCard from "@/components/courts/CourtCard";
import { DesktopHeader } from "@/components/ui/TopNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { List, ListFilter } from "lucide-react";

export default function CourtsPage() {
  const firestore = useFirestore();

  const [selectedState, setSelectedState] = useState<string | "all">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const courtsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, "courts"), orderBy("name", sortOrder));
  }, [firestore, sortOrder]);

  const { data: courts = [], isLoading } = useCollection<Court>(courtsQuery);

  const states = useMemo(() => {
    const stateSet = new Set(
      courts
        .map((court) => {
            const parts = court.address?.split(', ');
            return parts?.[parts.length - 2]?.split(' ')[0];
        })
        .filter(Boolean) as string[]
    );
    return ["all", ...Array.from(stateSet).sort()];
  }, [courts]);

  const filteredCourts = useMemo(() => {
    if (selectedState === "all") {
      return courts;
    }
    return courts.filter((court) => {
        const parts = court.address?.split(', ');
        const stateAbbr = parts?.[parts.length - 2]?.split(' ')[0];
        return stateAbbr === selectedState;
    });
  }, [courts, selectedState]);
  
  const toggleSortOrder = () => {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Find a Court" />
      <main className="flex-1 w-full p-4 pb-24 space-y-4 md:p-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-full bg-card border-white/10">
                   <ListFilter size={16} className="text-white/50 mr-2" />
                  <SelectValue placeholder="Filter by state..." />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state === "all" ? "All States" : state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                <List size={16}/>
             </Button>
          </div>

          {isLoading ? (
            <p className="text-white text-center mt-10">Loading courts...</p>
          ) : filteredCourts.length > 0 ? (
            filteredCourts.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))
          ) : (
            <div className="text-center py-10 bg-card rounded-lg">
                <p className="text-white/70">No courts found for this filter.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
