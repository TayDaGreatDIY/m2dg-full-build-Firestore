
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import type { User as AppUser } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user: authUser, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: user, isLoading: isUserDocLoading } = useDoc<AppUser>(userDocRef);

  const isLoading = isAuthLoading || isUserDocLoading;

  useEffect(() => {
    // If loading is finished and there's no authed user, redirect to login
    if (!isLoading && !authUser) {
      router.replace('/login');
    }
    // If loading is finished, we have an authed user, but their profile doc shows they aren't an admin
    if (!isLoading && authUser && user && user.role !== 'admin') {
      router.replace('/dashboard'); // Redirect non-admins away
    }
  }, [isLoading, authUser, user, router]);

  // While loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if the user is not an admin, show an access denied message while redirect happens
  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background">
        <Lock className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-bold">Access Denied</h2>
        <p className="text-white/60">You do not have permission to view this page.</p>
      </div>
    );
  }

  // If user is an admin, render the admin layout
  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Admin Panel" />
      <main className="flex-1 w-full max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  );
}
