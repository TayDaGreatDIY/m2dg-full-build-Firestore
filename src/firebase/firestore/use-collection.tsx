"use client";
import { useEffect, useMemo, useState } from "react";
import { onSnapshot, Query, CollectionReference, DocumentData, FirestoreError } from "firebase/firestore";

type DataWithId<T> = T & { id: string };
type DataArray<T> = DataWithId<T>[];

export function useCollection<T = DocumentData>(
  targetRefOrQuery: Query<DocumentData> | CollectionReference<DocumentData> | null | undefined
) {
  const [data, setData] = useState<DataArray<T>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const disabled = useMemo(() => targetRefOrQuery == null, [targetRefOrQuery]);

  useEffect(() => {
    if (disabled) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      targetRefOrQuery as Query<DocumentData>,
      (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as T),
        }));
        setData(rows as DataArray<T>);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [disabled, targetRefOrQuery]);

  return { data, isLoading, error };
}
