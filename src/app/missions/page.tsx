'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, where, getDocs, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Loader2, Trophy, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mission } from '@/lib/types';


export default function MissionsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [missions, setMissions] = useState<Mission[]|null>(null);
  const [loadingId, setLoadingId] = useState<string|null>(null);

  useEffect(() => {
    if (!user || !db) return;
    const goalsCol = collection(db, 'users', user.uid, 'goals');
    // active goals
    getDocs(query(goalsCol, where('status','==','active'))).then(activeSnap => {
      const ids = activeSnap.docs.map(d => d.id);
      if (!ids.length) { setMissions([]); return; }
      const unsubscribes = ids.map(goalId => onSnapshot(
        query(collection(db, 'users', user.uid, 'goals', goalId, 'missions'), orderBy('createdAt','asc')),
        snap => {
          const all = snap.docs.map(d => d.data() as Mission);
          setMissions(prev => {
            const others = (prev || []).filter(m => m.goalId !== goalId);
            return [...others, ...all].sort((a,b)=> (a.status === 'completed') ? 1 : (b.status === 'completed') ? -1 : 0);
          });
        }
      ));
      return () => unsubscribes.forEach(u => u());
    });
  }, [user, db]);

  const totalXP = useMemo(() => (missions||[]).filter(m=>m.status==='completed').reduce((s,m)=>s+m.xp,0), [missions]);

  const markComplete = async (m: Mission) => {
    if (!user || !db) return;
    setLoadingId(m.id);
    try {
      const ref = doc(db, 'users', user.uid, 'goals', m.goalId, 'missions', m.id);
      await updateDoc(ref, { status: 'completed', completedAt: Date.now() });
      // xp counters doc - increment handled by cloud function if setup, otherwise client-side
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <DesktopHeader pageTitle="Missions" />
      <div className="max-w-3xl mx-auto w-full p-4 space-y-6">
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <div className="text-white/90 font-medium">Total XP Earned From Missions: {totalXP}</div>
            </div>
             <Button
                className="bg-orange hover:bg-orange/80 text-black"
                onClick={async () => {
                    if (!user) return;
                    const topic = prompt("What goal do you want to work on? (e.g., Improve jump shot)") || "Improve jump shot";
                    const focus = "shooting"; // Simplified for now
                    try {
                    const res = await fetch("/api/missions-flow", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                        userId: user.uid,
                        goal: { title: topic, focusArea: focus },
                        }),
                    });
                    const data = await res.json();
                    console.log("🔥 Mission Flow Response:", data);
                    if (res.ok) {
                        alert(`✅ New goal created! Refreshing your missions...`);
                    } else {
                        throw new Error(data.error || "Failed to create goal.");
                    }
                    } catch (err: any) {
                    console.error(err);
                    alert(`⚠️ Could not create a goal: ${err.message}`);
                    }
                }}
                >
                ➕ Generate New Goal
            </Button>
        </div>

        <div className="space-y-4">
          {missions === null && <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-white/50" /></div>}
          {(missions ?? []).map(m => (
            <div key={m.id} className={cn(
              'rounded-xl p-4 border border-white/10 bg-card/60 backdrop-blur',
              m.status==='completed' && 'opacity-60'
            )}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-medium">{m.title}</div>
                  <div className="text-white/60 text-sm">
                    {m.progress?.target ? `${m.progress.current ?? 0}/${m.progress.target} ${m.progress.unit||''}` : 'Single task'}
                    {' • '}Difficulty {m.difficulty} • {m.xp} XP
                  </div>
                </div>

                {m.status!=='completed' ? (
                  <Button size="sm" onClick={()=>markComplete(m)} disabled={loadingId===m.id}>
                    {loadingId===m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-1"/> Complete</>}
                  </Button>
                ) : (
                  <div className="text-green-400 text-sm flex items-center"><CheckCircle2 className="h-4 w-4 mr-1"/>Completed</div>
                )}
              </div>

              {m.progress?.target && (
                <div className="mt-3">
                  <Progress value={Math.min(100, Math.round(((m.progress.current||0)/m.progress.target)*100))} />
                </div>
              )}
            </div>
          ))}

          {missions && missions.length===0 && (
            <div className="text-center text-white/60 py-10">No missions yet. Generate a new goal to get started!</div>
          )}
        </div>
      </div>
    </div>
  );
}
