
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import type { Goal, Mission } from '@/lib/types';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Target } from 'lucide-react';
import { missionsFlow } from '@/ai/flows/missions-flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MissionItem = ({ mission, onToggle }: { mission: Mission; onToggle: (missionId: string, status: boolean) => void }) => {
  return (
    <div
      className={`flex items-center space-x-3 p-3 rounded-md transition-all ${
        mission.status === 'complete' ? 'bg-green-600/10 text-white/60' : 'bg-background'
      }`}
    >
      <Checkbox
        id={mission.id}
        checked={mission.status === 'complete'}
        onCheckedChange={(checked) => onToggle(mission.id, !!checked)}
        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-400"
      />
      <label
        htmlFor={mission.id}
        className={`flex-1 text-sm font-medium leading-none ${
          mission.status === 'complete' ? 'line-through' : ''
        }`}
      >
        {mission.title}
        <span className="ml-2 text-xs font-normal text-white/40">({mission.xpValue} XP)</span>
      </label>
    </div>
  );
};

export default function MissionsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'goals'),
      where('status', '==', 'in-progress'),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: goals, isLoading: areGoalsLoading, setData: setGoals } = useCollection<Goal>(goalsQuery);

  const handleToggleMission = async (missionId: string, isComplete: boolean) => {
    if (!user || !goals) return;

    const goal = goals.find(g => g.missions.some(m => m.id === missionId));
    if (!goal) return;

    const goalRef = doc(firestore, 'users', user.uid, 'goals', goal.id);

    const updatedMissions = goal.missions.map(m =>
      m.id === missionId ? { ...m, status: isComplete ? 'complete' : 'in-progress' } : m
    );
    
    const allComplete = updatedMissions.every(m => m.status === 'complete');
    
    try {
      await updateDoc(goalRef, {
        missions: updatedMissions,
        status: allComplete ? 'complete' : 'in-progress',
      });

      if (isComplete) {
        const mission = goal.missions.find(m => m.id === missionId);
        toast({
          title: 'Mission Complete!',
          description: `You earned ${mission?.xpValue || 0} XP. Keep grinding!`,
          className: 'bg-green-600/20 border-green-500/50 text-white',
        });
      }
    } catch (error) {
      console.error('Error updating mission status:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update mission.' });
    }
  };
  
  const handleSetNewGoal = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      // In a real app, you'd have a dialog to get playerInput
      const playerInput = "I want to improve my 3-point shooting.";
      await missionsFlow({ userId: user.uid, playerInput });
      // The flow now handles creating the docs, so we just need to let the useCollection hook refresh
      toast({
        title: "New Missions Generated!",
        description: "Your new goals are ready. Let's get to work."
      })
    } catch (error) {
      console.error("Error generating new missions:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not generate new missions.' });
    } finally {
      setIsGenerating(false);
    }
  }


  const pageLoading = isUserLoading || areGoalsLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Missions" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold font-headline">Weekly Missions</h2>
              <p className="text-white/60 text-sm">Complete these goals to earn XP and unlock badges.</p>
            </div>
             <Button onClick={handleSetNewGoal} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="animate-spin" /> : <Target />}
              {isGenerating ? 'Generating...' : 'Set New Goal'}
            </Button>
          </div>

          {pageLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : goals && goals.length > 0 ? (
            goals.map((goal) => (
              <Card key={goal.id} className="bg-card border-white/10">
                <CardHeader>
                  <CardTitle className="font-headline text-lg text-gold">{goal.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {goal.missions.map((mission) => (
                    <MissionItem key={mission.id} mission={mission} onToggle={handleToggleMission} />
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-lg border border-dashed border-white/20">
              <Target className="mx-auto w-12 h-12 text-white/30" />
              <h3 className="font-bold font-headline text-lg mt-4">No Active Missions</h3>
              <p className="text-sm text-white/50 mt-1">Click "Set New Goal" to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
