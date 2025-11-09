// src/firebase/firestore/use-doc.tsx

import { useEffect, useMemo, useState } from "react";
import type {
  DocumentData,
  DocumentReference,
  FirestoreError,
} from "firebase/firestore";
import { onSnapshot } from "firebase/firestore";

// ✅ Import the WithId type from use-collection to avoid duplicate exports
import type { WithId } from "./use-collection";

/**
 * React hook for subscribing to a single Firestore document.
 * Handles loading, error, and live updates automatically.
 */
type TargetRef<T> = DocumentReference<T> | null | undefined;

export function useDoc<T = DocumentData>(targetRef: TargetRef<T>) {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!targetRef);
  const [error, setError] = useState<FirestoreError | null>(null);

  // Prevent re-subscribing unnecessarily if the ref doesn’t change
  const ref = useMemo(() => targetRef ?? null, [targetRef]);

  useEffect(() => {
    // Guard clause for empty refs
    if (!ref) {
      setIsLoading(false);
      setError(null);
      setData(null);
      return;
    }

    // Set loading state while fetching
    setIsLoading(true);
    setError(null);

    // Subscribe to document snapshot updates
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const docData = snapshot.data();
        if (docData) {
          setData({ id: snapshot.id, ...(docData as T) });
        } else {
          setData(null);
        }
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        console.error("Firestore document listener error:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup on unmount
    return () => unsubscribe();
  }, [ref]);

  return { data, isLoading, error };
}
