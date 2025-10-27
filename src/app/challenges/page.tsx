
"use client";

import { DesktopHeader } from "@/components/ui/TopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Medal, Target, CheckCircle, Trophy } from "lucide-react";

const challenges = [
  {
    id: 'consistency',
    title: '7-Day Consistency',
    description: 'Hoop or train once per day for 7 straight days.',
    badge: 'ACTIVE',
    badgeVariant: 'gold',
    icon: CheckCircle
  },
  {
    id: 'free-throw',
    title: 'Free Throw Contest',
    description: 'Make 10 free throws in a row. All net, no rim. Verified by video.',
    badge: 'NEW',
    badgeVariant: 'secondary',
    icon: Medal
  },
  {
    id: '3-point-shooting',
    title: '5-Spot 3-Point Shooting',
    description: 'Make 5 three-pointers from each of the 5 main spots. We track percentage and time.',
    badge: 'NEW',
    badgeVariant: 'secondary',
    icon: Target
  },
  {
    id: 'mid-range-shooting',
    title: '5-Spot Mid-Range',
    description: 'Make 5 shots from each spot, free-throw line extended. We track percentage and time.',
    badge: 'NEW',
    badgeVariant: 'secondary',
    icon: Target
  },
  {
    id: 'half-court',
    title: 'Half-Court Shot',
    description: 'How many attempts does it take you to make a half-court shot? Show us.',
    badge: 'PROVING GROUNDS',
    badgeVariant: 'orange',
    icon: Trophy
  },
  {
    id: 'full-court',
    title: 'Full-Court Heave',
    description: 'The ultimate challenge. How many attempts for a full-court shot?',
    badge: 'PROVING GROUNDS',
    badgeVariant: 'orange',
    icon: Trophy
  }
];


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
                         <Badge variant={challenge.badgeVariant as any}>{challenge.badge}</Badge>
                    </div>
                    <Link href="/training" className="w-full block">
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
