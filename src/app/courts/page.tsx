"use client";

import TopNav from "@/components/ui/TopNav";
import CourtCard from "@/components/courts/CourtCard";
import { Button } from "@/components/ui/button";
import { demoCourts } from "@/lib/demoData";

export default function CourtsPage() {
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
          {demoCourts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      </main>
    </div>
  );
}
