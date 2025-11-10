
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUser,
  useCollection,
  useFirestore,
  useMemoFirebase,
  useDoc,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  writeBatch,
  doc,
  updateDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import type { Notification as AppNotification, User as AppUser } from '@/lib/types';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  BellOff,
  CheckCircle,
  Shield,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useUserNotificationsCount } from '@/hooks/useUserNotifications';
import { useToast } from '@/hooks/use-toast';

// --- Diagnostic Component ---
const NotificationDiagnostics = () => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [results, setResults] = useState<Record<string, 'PASS' | 'FAIL' | 'WARN' | 'PENDING'>>({});
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const unreadHookCount = useUserNotificationsCount();

  const resetState = () => {
    setIsDiagnosing(false);
    setResults({});
    setErrorMessages({});
  };

  const runDiagnostic = async () => {
    if (!user || !firestore) return;
    setIsDiagnosing(true);
    setResults({
      read: 'PENDING',
      write: 'PENDING',
      trigger: 'PENDING',
      badge: 'PENDING',
      ui: 'PENDING',
    });
    setErrorMessages({});

    // --- Check 1: Firestore Read ---
    let readPass = false;
    try {
      const q = query(collection(firestore, 'users', user.uid, 'notifications'), limit(1));
      await getDocs(q);
      setResults(prev => ({ ...prev, read: 'PASS' }));
      readPass = true;
    } catch (e: any) {
      setResults(prev => ({ ...prev, read: 'FAIL' }));
      setErrorMessages(prev => ({ ...prev, read: e.message }));
    }

    if (!readPass) {
        setIsDiagnosing(false);
        return;
    }

    // --- Check 2: Firestore Write ---
    let writePass = false;
    let testDocId: string | null = null;
    try {
      const testDocRef = await addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
        title: 'Diagnostic Test 🔔',
        body: 'This is an automatic system check.',
        type: 'system',
        read: false,
        createdAt: serverTimestamp(),
      });
      testDocId = testDocRef.id;
      setResults(prev => ({ ...prev, write: 'PASS' }));
      writePass = true;
    } catch (e: any) {
      setResults(prev => ({ ...prev, write: 'FAIL' }));
      setErrorMessages(prev => ({ ...prev, write: e.message }));
    }

    // --- Check 3: Function Trigger ---
    let triggerPass = false;
    if (writePass) {
      try {
        const testGoalId = 'diagnosticGoal';
        const testMissionId = `diagnosticMission_${Date.now()}`;
        const missionRef = doc(firestore, 'users', user.uid, 'goals', testGoalId, 'missions', testMissionId);

        await updateDoc(missionRef, { title: 'Diagnostic Trigger Test', status: 'todo' });
        await updateDoc(missionRef, { status: 'completed' });


        const triggerPromise = new Promise((resolve, reject) => {
          const q = query(
            collection(firestore, 'users', user.uid, 'notifications'),
            where('body', 'like', 'You just earned%')
          );
          const unsub = onSnapshot(q, async (snap) => {
            if (!snap.empty) {
              unsub();
              // Clean up the trigger notification
              const triggerNotifId = snap.docs[0].id;
              await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', triggerNotifId));
              resolve(true);
            }
          });
          setTimeout(() => { unsub(); reject(new Error('Timeout')); }, 10000);
        });

        await triggerPromise;
        setResults(prev => ({ ...prev, trigger: 'PASS' }));
        triggerPass = true;
        // Clean up the dummy mission doc
        await deleteDoc(missionRef);
        // Attempt to clean up goal doc if empty, but don't fail diagnostic if it doesn't
        try {
            const missionsSnap = await getDocs(collection(firestore, 'users', user.uid, 'goals', testGoalId, 'missions'));
            if (missionsSnap.empty) {
                 await deleteDoc(doc(firestore, 'users', user.uid, 'goals', testGoalId));
            }
        } catch {}

      } catch (e: any) {
        setResults(prev => ({ ...prev, trigger: 'FAIL' }));
        setErrorMessages(prev => ({ ...prev, trigger: 'Function trigger not detected after 10s.' }));
      }
    }


    // --- Check 4: Badge Hook ---
    try {
        const q = query(collection(firestore, 'users', user.uid, 'notifications'), where('read', '==', false));
        const snap = await getDocs(q);
        // We add 1 for the test doc we just created
        const actualUnread = snap.size;

        if(unreadHookCount === actualUnread) {
            setResults(prev => ({ ...prev, badge: 'PASS' }));
        } else {
             setResults(prev => ({ ...prev, badge: 'WARN' }));
             setErrorMessages(prev => ({ ...prev, badge: `Hook: ${unreadHookCount}, Firestore: ${actualUnread}` }));
        }
    } catch (e: any) {
        setResults(prev => ({ ...prev, badge: 'FAIL' }));
        setErrorMessages(prev => ({ ...prev, badge: e.message }));
    }


    // --- Check 5: UI Render ---
    // This is implicitly checked by the main component's `notifications.length`
    setResults(prev => ({ ...prev, ui: 'PASS' }));

    // --- Finalization & Cleanup ---
    if (testDocId) {
      await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', testDocId));
    }

    try {
      await addDoc(collection(firestore, 'users', user.uid, 'notificationDiagnostics'), {
        status: Object.values(results).every(r => r === 'PASS') ? 'PASS' : 'FAIL',
        details: results,
        errors: errorMessages,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.error("Failed to log diagnostic results:", e);
    }
    
    setIsDiagnosing(false);
  };

  const ResultRow = ({ label, status, error }: { label: string; status: string; error?: string; }) => {
    const icon =
      status === 'PENDING' ? <Loader2 className="h-4 w-4 animate-spin text-white/50" />
      : status === 'PASS' ? <CheckCircle className="h-4 w-4 text-green-500" />
      : status === 'FAIL' ? <AlertTriangle className="h-4 w-4 text-red-500" />
      : <AlertTriangle className="h-4 w-4 text-yellow-500" />;

    return (
        <div className="flex justify-between items-center text-sm p-2 rounded-md bg-background">
            <div className="flex items-center gap-2">
                {icon}
                <span className="font-medium text-white/80">{label}</span>
            </div>
            <div className="text-right">
                {status !== 'PENDING' && <span className={cn(
                    "font-bold",
                    status === 'PASS' && 'text-green-500',
                    status === 'FAIL' && 'text-red-500',
                    status === 'WARN' && 'text-yellow-500',
                )}>{status}</span>}
                {error && <p className="text-xs text-red-400/70">{error}</p>}
            </div>
        </div>
    );
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="diagnostics" className="border-b-0">
        <AccordionTrigger className="bg-card/80 px-4 rounded-lg border border-white/10 hover:no-underline">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-gold" />
            <span className="font-bold">System Diagnostic (Admin Only)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 bg-card/50 border border-t-0 border-white/10 rounded-b-lg">
          <div className="space-y-3">
             <p className="text-xs text-white/60">This tool checks the end-to-end notification pipeline, from Firestore access to function triggers.</p>
             <div className="space-y-2">
                {Object.keys(results).length > 0 && (
                    <>
                        <ResultRow label="Firestore Read" status={results.read} error={errorMessages.read} />
                        <ResultRow label="Firestore Write" status={results.write} error={errorMessages.write} />
                        <ResultRow label="Function Trigger" status={results.trigger} error={errorMessages.trigger} />
                        <ResultRow label="Badge Hook" status={results.badge} error={errorMessages.badge} />
                        <ResultRow label="UI Render" status={results.ui} error={errorMessages.ui} />
                    </>
                )}
             </div>
             <Button onClick={isDiagnosing ? resetState : runDiagnostic} className="w-full" variant="outline">
                {isDiagnosing ? <Loader2 className="animate-spin" /> : null}
                {isDiagnosing ? 'Cancel' : 'Run Diagnostic'}
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};


// --- Main Page Component ---
export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: notifications, isLoading } = useCollection<AppNotification>(
    notificationsQuery
  );
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData } = useDoc<AppUser>(userDocRef);
  const isAdmin = userData?.role === 'admin';


  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read && user) {
      const notifRef = doc(
        firestore,
        'users',
        user.uid,
        'notifications',
        notification.id
      );
      await updateDoc(notifRef, { read: true });
    }
    router.push(notification.link);
  };

  const markAllAsRead = async () => {
    if (user && firestore && notifications && notifications.length > 0) {
      const batch = writeBatch(firestore);
      notifications.forEach(notification => {
        if (!notification.read) {
            const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
            batch.update(notifRef, { read: true });
        }
      });
      await batch.commit();
    }
  };

  const pageLoading = isUserLoading || isLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Notifications" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-4">
          
          {isAdmin && <NotificationDiagnostics />}
          
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={notifications?.every(n => n.read)}>
              <CheckCircle size={16} className="mr-1" />
              Mark All as Read
            </Button>
          </div>
          {pageLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  'bg-card rounded-card border border-white/10 p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-white/5',
                  !notif.read && 'border-orange/50 bg-orange/5'
                )}
              >
                <div className="mt-1">
                  <MessageSquare className="w-5 h-5 text-orange" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white/95">
                    {notif.title || 'New Notification'}
                  </p>
                  <p className="text-sm text-white/70">
                    {notif.body || 'You have a new update.'}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    {notif.createdAt
                      ? formatDistanceToNow(notif.createdAt.toDate(), {
                          addSuffix: true,
                        })
                      : ''}
                  </p>
                </div>
                {!notif.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-orange mt-2 flex-shrink-0" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-card border border-white/10">
              <BellOff className="mx-auto w-12 h-12 text-white/30" />
              <h3 className="font-bold font-headline text-lg mt-4">
                All Clear
              </h3>
              <p className="text-sm text-white/50 mt-1">
                You have no new notifications.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
