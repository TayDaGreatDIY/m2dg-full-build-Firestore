
"use client";

import TopNav from "@/components/ui/TopNav";
import TrainingSummary from "@/components/training/TrainingSummary";
import TrainingForm from "@/components/training/TrainingForm";
import { useAuth } from "@/hooks/useAuth";
import { useCollection } from "@/hooks/useCollection";
import type { TrainingLog } from "@/lib/types";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from "react";

export default function TrainingPage() {
  const { user } = useAuth();

  const trainingQuery = user
    ? query(
        collection(db, "trainingLogs"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      )
    : undefined;

  const { data: recentWork, loading } = useCollection<TrainingLog>('trainingLogs', trainingQuery);

  // Client-side state to avoid hydration mismatch
  const [formattedWork, setFormattedWork] = useState<any[]>([]);

  useEffect(() => {
    if (recentWork) {
      setFormattedWork(recentWork.map(work => ({
        ...work,
        timeAgo: work.createdAt ? formatDistanceToNow(work.createdAt.toDate(), { addSuffix: true }) : ''
      })));
    }
  }, [recentWork]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
        <TopNav pageTitle="Training Hub" />
        
        <TrainingSummary />
        <TrainingForm />

        <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-3">
            <h3 className="font-bold font-headline text-lg">Recent Work</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : formattedWork.length > 0 ? (
              <ul className="space-y-2 list-disc list-inside text-sm text-white/70">
                  {formattedWork.map((work) => (
                      <li key={work.id}>
                        {work.timeAgo} • {work.workType} @ {work.location} • {work.notes}
                      </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-white/50">No recent sessions logged.</p>
            )}
        </div>
      </main>
    </div>
  );
}
