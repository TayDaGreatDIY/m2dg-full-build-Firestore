
'use client';
import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function XpBar() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (!user || !firestore) return;
    const ref = doc(firestore, "users", user.uid, "stats", "main");
    const unsub = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setXp(data.xp || 0);
        setLevel(data.level || 1);
      }
    });
    return () => unsub();
  }, [user, firestore]);

  const progress = ((xp % 100) / 100) * 100;

  return (
    <div className="p-3 rounded-xl bg-card border border-white/10 mt-3">
      <p className="text-sm text-white/70 mb-1">
        Level {level} • {xp} XP
      </p>
      <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-orange transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
