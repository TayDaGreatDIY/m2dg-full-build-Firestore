"use client";
import { useEffect, useMemo, useState } from "react";
import { DocumentReference, DocumentData, onSnapshot, FirestoreError } from "firebase/firestore";

export function useDoc<T = DocumentData>(ref: DocumentReference<DocumentData> | null | undefined) {
  const disabled = useMemo(() => ref == null, [ref]);
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (disabled) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      ref as DocumentReference<DocumentData>,
      (snap) => {
        if (snap.exists()) {
          setData({ id: snap.id, ...(snap.data() as T) });
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [disabled, ref]);

  return { data, isLoading, error };
}
