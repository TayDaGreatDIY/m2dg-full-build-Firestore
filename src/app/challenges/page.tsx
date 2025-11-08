
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { challenges } from "@/lib/challengeData";


export default function ChallengesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Challenges" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-4">

            {challenges.map((challenge) => {
              const Icon = challenge.icon;
              return (
                <div key={challenge.id} className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <Icon className="w-6 h-6 text-orange mt-1" />
                            <div>
                                <h2 className="text-lg font-bold font-headline">{challenge.title}</h2>
                                <p className="text-sm text-white/60">{challenge.description}</p>
                            </div>
                        </div>
                         <Badge variant={challenge.badgeVariant}>{challenge.badge}</Badge>
                    </div>
                    <Link href={`/challenges/${challenge.id}`} className="w-full block">
                        <Button variant="primary" className="w-full">Attempt Challenge</Button>
                    </Link>
                </div>
              );
            })}

        </div>
      </main>
    </div>
  );
}
