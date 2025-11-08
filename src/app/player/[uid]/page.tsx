
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useUser as useAuthUser, useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, query, orderBy, limit, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { DesktopHeader } from '@/components/ui/TopNav';
import UserAvatar from '@/components/ui/UserAvatar';
import StatTile from '@/components/ui/StatTile';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageSquare, PlayCircle, Loader2, Edit } from 'lucide-react';
import type { User, TrainingLog } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthUser();
  const firestore = useFirestore();
  const uid = params.uid as string;

  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Fetch player data
  const playerDocRef = useMemoFirebase(() => {
    if (!firestore || !uid) return null;
    return doc(firestore, 'users', uid);
  }, [firestore, uid]);
  const { data: player, isLoading: isPlayerLoading } = useDoc<User>(playerDocRef);

  // Fetch player's training logs
  const trainingQuery = useMemoFirebase(() => {
    if (!firestore || !uid) return null;
    return query(
      collection(firestore, "users", uid, "training_sessions"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [firestore, uid]);
  const { data: trainingLogs, isLoading: isTrainingLoading } = useCollection<TrainingLog>(trainingQuery);

  const [formattedLogs, setFormattedLogs] = useState<any[]>([]);

  useEffect(() => {
    if (trainingLogs) {
      setFormattedLogs(trainingLogs.map(log => ({
        ...log,
        timeAgo: log.createdAt ? formatDistanceToNow(log.createdAt.toDate(), { addSuffix: true }) : ''
      })));
    }
  }, [trainingLogs]);

  const handleSendMessage = async () => {
    if (!currentUser || !player || isCreatingChat || !firestore) return;

    setIsCreatingChat(true);

    try {
      const chatsRef = collection(firestore, "chats");
      const existingChatQuery = query(
        chatsRef,
        where("memberIds", "array-contains", currentUser.uid)
      );

      const querySnapshot = await getDocs(existingChatQuery);
      let existingChatId: string | null = null;
      
      querySnapshot.forEach(doc => {
        const chat = doc.data();
        if (chat.memberIds.includes(player.uid)) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        router.push(`/messages/${existingChatId}`);
      } else {
        const newChatRef = await addDoc(collection(firestore, "chats"), {
          memberIds: [currentUser.uid, player.uid],
          lastMessage: `Started a conversation with ${player.displayName}.`,
          lastTimestamp: serverTimestamp(),
        });
        router.push(`/messages/${newChatRef.id}`);
      }
    } catch (error) {
      console.error("Error creating or finding chat:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const isLoading = isPlayerLoading || isTrainingLoading;
  const isOwnProfile = currentUser?.uid === uid;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Player Profile" />
        <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6 animate-pulse">
          <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className='space-y-2'>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-48 w-full" />
        </main>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <p>Player profile not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Player Profile" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-6">
          
          <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4">
            <div className="flex items-center gap-4">
              <UserAvatar src={player.avatarURL} name={player.displayName} size={64} />
              <div>
                <h2 className="text-xl font-bold font-headline">{player.displayName}</h2>
                <p className="text-base text-white/50">@{player.username}</p>
              </div>
            </div>
            {player.aboutMe && (
                <div className="text-sm text-white/90 border-l-2 border-orange/30 pl-3">
                    <p>{player.aboutMe}</p>
                </div>
            )}
            <div className="flex gap-2">
                {isOwnProfile ? (
                     <Button onClick={() => router.push('/profile/edit')} className="w-full">
                        <Edit size={16} />
                        Edit Profile
                    </Button>
                ) : (
                    <Button onClick={handleSendMessage} disabled={isCreatingChat || !currentUser} className="w-full">
                        {isCreatingChat ? <Loader2 className="animate-spin" /> : <MessageSquare size={16} />}
                        Message {player.displayName}
                    </Button>
                )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatTile label="XP Points" value={player.xp} />
            <StatTile label="Training Streak" value={`${player.trainingStreak}d`} />
            <StatTile label="Win Streak" value={`${player.winStreak}W`} />
            <StatTile label="Home Court" value={player.homeCourt} />
          </div>

          <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-3">
            <h3 className="font-bold font-headline text-lg">Recent Activity</h3>
            {formattedLogs.length > 0 ? (
              <ul className="space-y-3 text-sm text-white/70">
                {formattedLogs.map((log) => (
                  <li key={log.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{log.workType}</span> @ {log.location}
                      <p className="text-xs text-white/50">{log.timeAgo}</p>
                      {log.notes && <p className="text-white/90 text-sm mt-1 pl-2 border-l-2 border-orange/20">{log.notes}</p>}
                    </div>
                    {log.mediaURL && (
                      <Link href={log.mediaURL} target="_blank">
                        <PlayCircle className="text-orange hover:text-gold transition-colors" />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-white/50">No recent activity logged.</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
