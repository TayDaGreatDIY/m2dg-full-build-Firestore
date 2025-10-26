
"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useCollection<T>(path: string, query?: Query) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ref = query || collection(db, path);
    
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const results: T[] = [];
      snapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(results);
      setLoading(false);
    }, (err) => {
      console.error(`Error fetching collection at ${path}:`, err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path, query]);

  return { data, loading, error };
}
