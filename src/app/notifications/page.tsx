'use client';

import {
  useUser,
  useCollection,
  useFirestore,
  useMemoFirebase,
} from '@/firebase';
import {
  collection,
  query,
  orderBy,
  writeBatch,
  doc,
  updateDoc,
} from 'firebase/firestore';
import type { Notification as AppNotification } from '@/lib/types';
import { DesktopHeader } from '@/components/ui/TopNav';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MessageSquare,
  BellOff,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';


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

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read && user && firestore) {
      const notifRef = doc(
        firestore,
        'users',
        user.uid,
        'notifications',
        notification.id
      );
      await updateDoc(notifRef, { read: true });
    }
    router.push(notification.link || '/dashboard');
  };

  const markAllAsRead = async () => {
    if (user && firestore && notifications && notifications.length > 0) {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) return;
      
      const batch = writeBatch(firestore);
      unreadNotifications.forEach(notification => {
        const notifRef = doc(firestore, 'users', user.uid, 'notifications', notification.id);
        batch.update(notifRef, { read: true });
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
