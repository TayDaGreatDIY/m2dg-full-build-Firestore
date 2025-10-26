
"use client";

import { useUser, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import UserAvatar from "./UserAvatar";
import { Button } from "./button";
import { doc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { User as AppUser } from "@/lib/types";

type TopNavProps = {
  pageTitle: string;
};

export default function TopNav({ pageTitle }: TopNavProps) {
  const { user: authUser, isUserLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center gap-2">
        <div className="text-gold font-extrabold text-xl font-headline">🏀 M2DG</div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <h1 className="text-lg font-bold tracking-tight text-white/90 font-headline">{pageTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && !isUserLoading && (
          <>
            <UserAvatar src={user.avatarURL} name={user.displayName} size={32} />
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-[11px] px-2 py-1"
            >
              Log Out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
