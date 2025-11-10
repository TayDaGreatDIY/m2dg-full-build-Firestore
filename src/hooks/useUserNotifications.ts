
"use client";

import { useEffect, useState } from "react";
import { useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export function useUserNotificationsCount() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [count, setCount] = useState(0);

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, "users", user.uid, "notifications"),
      where("read", "==", false)
    );
  }, [user, firestore]);

  useEffect(() => {
    if (!notificationsQuery) {
        setCount(0);
        return;
    };
    const unsub = onSnapshot(notificationsQuery, (snap) => setCount(snap.size));
    return () => unsub();
  }, [notificationsQuery]);

  return count;
}
