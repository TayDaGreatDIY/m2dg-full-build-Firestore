
"use client";

import { useEffect, useState } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export function useUserNotificationsCount() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user || !firestore) {
        setCount(0);
        return;
    };
    const q = query(
      collection(firestore, "users", user.uid, "notifications"),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => setCount(snap.size));
    return () => unsub();
  }, [user, firestore]);

  return count;
}
