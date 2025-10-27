
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, writeBatch, doc } from "firebase/firestore";
import type { Notification } from "@/lib/types";
import { DesktopHeader } from "@/components/ui/TopNav";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );
  }, [user, firestore]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  // Mark notifications as read when the page is visited
  useEffect(() => {
    if (user && firestore && notifications && notifications.length > 0) {
      const unread = notifications.filter(n => !n.read);
      if (unread.length > 0) {
        const batch = writeBatch(firestore);
        unread.forEach(notification => {
          const notifRef = doc(firestore, "users", user.uid, "notifications", notification.id);
          batch.update(notifRef, { read: true });
        });
        batch.commit().catch(console.error);
      }
    }
  }, [notifications, user, firestore]);
  
  const handleNotificationClick = (link: string) => {
      router.push(link);
  }

  const pageLoading = isUserLoading || isLoading;

  return (
    <div className="flex flex-col min-h-screen">
      <DesktopHeader pageTitle="Notifications" />
      <main className="flex-1 w-full p-4 pb-24 space-y-6 md:p-6">
        <div className="max-w-md mx-auto space-y-4">
          {pageLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif.link)}
                className={`bg-card rounded-card border border-white/10 p-4 flex items-start gap-4 cursor-pointer transition-colors hover:bg-white/5 ${!notif.read ? 'border-orange/50' : 'opacity-70'}`}
              >
                <div className="mt-1">
                   <MessageSquare className="w-5 h-5 text-orange" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/90">
                    New message from <span className="font-bold">@{notif.fromName}</span>
                  </p>
                  <p className="text-xs text-white/50">
                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-card border border-white/10">
              <BellOff className="mx-auto w-12 h-12 text-white/30" />
              <h3 className="font-bold font-headline text-lg mt-4">All Clear</h3>
              <p className="text-sm text-white/50 mt-1">You have no new notifications.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
