"use client";

import TopNav from "@/components/ui/TopNav";
import TrainingSummary from "@/components/training/TrainingSummary";
import TrainingForm from "@/components/training/TrainingForm";

export default function TrainingPage() {
  const recentWork = [
      "10/25 • Drills @ The Cage • Ball-handling, footwork",
      "10/24 • Pickup @ Venice • 3 games, worked on defense",
      "10/23 • Weights • Lower body focus",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Training Hub" />
        
        <TrainingSummary />
        <TrainingForm />

        <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-3">
            <h3 className="font-bold font-headline text-lg">Recent Work</h3>
            <ul className="space-y-2 list-disc list-inside text-sm text-white/70">
                {recentWork.map((work, i) => (
                    <li key={i}>{work}</li>
                ))}
            </ul>
        </div>
      </main>
    </div>
  );
}
