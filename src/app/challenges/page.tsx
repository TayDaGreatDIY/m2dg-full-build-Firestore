
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ChallengesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Challenges" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
            <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-lg font-bold font-headline">7-Day Consistency</h2>
                        <p className="text-sm text-white/60">Hoop or train once per day for 7 straight days.</p>
                    </div>
                    <Badge variant="gold">ACTIVE</Badge>
                </div>
                <Link href="/training" className="w-full block">
                    <Button variant="primary" className="w-full">Log Today's Work</Button>
                </Link>
            </div>

            <div className="text-center py-10">
                <p className="text-white/50">No other active challenges yet.</p>
            </div>
        </div>
      </main>
    </div>
  );
}
