"use client";

import { useState, useEffect } from "react";
import {
  useUser,
  useDoc,
  useMemoFirebase,
  useCollection,
  useFirestore,
} from "@/firebase";
import { useRouter } from "next/navigation";
import { DesktopHeader } from "@/components/ui/TopNav";
import UserAvatar from "@/components/ui/UserAvatar";
import StatTile from "@/components/ui/StatTile";
import { Skeleton } from "@/components/ui/skeleton";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import type {
  User as AppUser,
  Challenge,
  Competition,
  CheckIn,
} from "@/lib/types";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { getPlayerRank, Rank } from "@/lib/xpSystem";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";

/* ------------------------------
   COMPONENTS
------------------------------- */
const ChallengeCard = ({ challenge }: { challenge: Challenge }) => (
  <Link href={`/challenges/${challenge.id}`} className="block">
    <div className="bg-background/50 p-3 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
      <p className="font-bold text-sm text-orange">{challenge.title}</p>
      <p className="text-xs text-white/60 line-clamp-2">
        {challenge.description}
      </p>
    </div>
  </Link>
);

const CompetitionCard = ({ competition }: { competition: Competition }) => (
  <div className="bg-background/50 p-3 rounded-lg border border-white/10">
    <p className="font-bold text-sm text-gold">{competition.title}</p>
    <p className="text-xs text-white/60">
      Prize: {competition.prize} |{" "}
      {competition.date?.toDate().toLocaleDateString()}
    </p>
  </div>
);

const CheckInFeedCard = ({ checkIn }: { checkIn: CheckIn }) => {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    if (checkIn.timestamp) {
      setTimeAgo(
        formatDistanceToNow(checkIn.timestamp.toDate(), { addSuffix: true })
      );
    }
  }, [checkIn.timestamp]);

  return (
    <div className="bg-background/50 p-3 rounded-lg border border-white/10 flex items-center gap-3">
      <UserAvatar
        src={checkIn.user?.avatarURL || ""}
        name={checkIn.user?.displayName || "User"}
        size={32}
      />
      <div>
        <p className="text-sm text-white/80">
          <span className="font-bold">
            @{checkIn.user?.displayName || "Player"}
          </span>{" "}
          checked in.
        </p>
        {timeAgo && <p className="text-xs text-white/50">{timeAgo}</p>}
      </div>
    </div>
  );
};

/* ------------------------------
   DASHBOARD PAGE
------------------------------- */
export default function DashboardPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => setHasMounted(true), []);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isUserLoading && !authUser) router.replace("/login");
  }, [authUser, isUserLoading, router]);

  /* ------------------------------
     Firestore User Document
  ------------------------------- */
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, "users", authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: isUserDocLoading } =
    useDoc<AppUser>(userDocRef);

  /* ------------------------------
     Active Challenges Query
  ------------------------------- */
  const challengesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "challenges"),
      where("approved", "==", true),
      limit(3)
    );
  }, [firestore]);

  const {
    data: activeChallenges,
    isLoading: areChallengesLoading,
  } = useCollection<Challenge>(challengesQuery as any);

  /* ------------------------------
     Nearby Competitions Query
  ------------------------------- */
  const competitionsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.city) return null;
    return query(
      collection(firestore, "competitions"),
      where("city", "==", user.city),
      limit(3)
    );
  }, [firestore, user?.city]);

  const {
    data: nearbyCompetitions,
    isLoading: areCompetitionsLoading,
  } = useCollection<Competition>(competitionsQuery as any);

  /* ------------------------------
     Home Court Check-Ins Query
  ------------------------------- */
  const checkinsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.homeCourtId) return null;
    return query(
      collection(firestore, "courts", user.homeCourtId, "checkins"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
  }, [firestore, user?.homeCourtId]);

  const {
    data: courtCheckins,
    isLoading: areCheckinsLoading,
  } = useCollection<CheckIn>(checkinsQuery as any);

  /* ------------------------------
     Rank + XP Progress
  ------------------------------- */
  const rankInfo: Rank | null = user ? getPlayerRank(user.xp) : null;
  const xpProgress =
    user && rankInfo
      ? ((user.xp - rankInfo.minXp) /
          (rankInfo.nextRankXp - rankInfo.minXp)) *
        100
      : 0;

  /* ------------------------------
     Loading States
  ------------------------------- */
  const loading =
    isUserLoading ||
    isUserDocLoading ||
    areChallengesLoading ||
    areCompetitionsLoading ||
    areCheckinsLoading;

  if (isUserLoading || !authUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasMounted || (loading && !user)) {
    return (
      <div className="flex flex-col min-h-screen">
        <DesktopHeader pageTitle="Dashboard" />
        <main className="flex-1 max-w-md mx-auto w-full px-4 pb-24 space-y-6">
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Could not load user profile.</p>
      </div>
    );
  }

  /* ------------------------------
     Render Dashboard
  ------------------------------- */
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Dashboard" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="bg-[var(--color-bg-card)] rounded-card border border-white/10 p-4 space-y-4 max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <UserAvatar src={user.avatarURL} name={user.displayName} size={48} />
            <div>
              <h2 className="text-lg font-bold font-headline">
                Welcome, {user.displayName}
              </h2>
              <Link href={`/player/${user.uid}`} className="hover:underline">
                <p className="text-sm text-white/50">@{user.username}</p>
              </Link>
            </div>
          </div>
          {rankInfo && (
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <p className="text-sm font-bold text-gold">{rankInfo.title}</p>
                <p className="text-xs text-white/50">
                  {user.xp} / {rankInfo.nextRankXp} XP to next rank
                </p>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <StatTile label="XP Points" value={user.xp} />
          <StatTile label="Training Streak" value={`${user.trainingStreak}d`} />
          <StatTile label="Win Streak" value={`${user.winStreak}W`} />
          <StatTile label="Home Court" value={user.homeCourt || "N/A"} />
        </div>

        {/* Active Challenges */}
        <div className="space-y-6 max-w-md mx-auto">
          <section>
            <h3 className="text-lg font-bold text-white/90 font-headline tracking-tight px-1 mb-2">
              Active Challenges
            </h3>
            <div className="space-y-2">
              {activeChallenges?.length ? (
                activeChallenges.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} />
                ))
              ) : (
                <p className="text-sm text-white/50 px-1">
                  No active challenges right now.
                </p>
              )}
            </div>
          </section>

          {/* Competitions */}
          <section>
            <h3 className="text-lg font-bold text-white/90 font-headline tracking-tight px-1 mb-2">
              Competitions Near You
            </h3>
            <div className="space-y-2">
              {nearbyCompetitions?.length ? (
                nearbyCompetitions.map((c) => (
                  <CompetitionCard key={c.id} competition={c} />
                ))
              ) : (
                <p className="text-sm text-white/50 px-1">
                  No competitions in {user.city} currently.
                </p>
              )}
            </div>
          </section>

          {/* Home Court Activity */}
          <section>
            <h3 className="text-lg font-bold text-white/90 font-headline tracking-tight px-1 mb-2">
              Home Court Activity
            </h3>
            <div className="space-y-2">
              {courtCheckins?.length ? (
                courtCheckins.map((c) => (
                  <CheckInFeedCard key={c.id} checkIn={c} />
                ))
              ) : (
                <p className="text-sm text-white/50 px-1">
                  No recent check-ins at {user.homeCourt}.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
