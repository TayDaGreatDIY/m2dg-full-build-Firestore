// src/firebase/firestore/use-collection.tsx
import { useEffect, useMemo, useState } from "react";
import type {
  CollectionReference,
  DocumentData,
  FirestoreError,
  Query,
  QuerySnapshot,
} from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

export type WithId<T> = T & { id: string };

type TargetRef<T> = Query<T> | CollectionReference<T> | null | undefined;

export function useCollection<T = DocumentData>(targetRef: TargetRef<T>) {
  // If the caller passes null because prerequisites (user, db, params) aren’t ready,
  // we short-circuit to a stable, typed empty result.
  const [data, setData] = useState<WithId<T>[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!targetRef);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Memo guard so dependency doesn’t thrash
  const ref = useMemo(() => targetRef ?? null, [targetRef]);

  useEffect(() => {
    if (!ref) {
      setIsLoading(false);
      setError(null);
      setData([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsub = onSnapshot(
      ref,
      (snap: QuerySnapshot<T>) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
        setData(rows);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [ref]);

  return { data, isLoading, error };
}
