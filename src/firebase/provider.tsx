"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { useUser } from './auth/use-user';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  firebaseApp: null,
  auth: null,
  firestore: null,
  storage: null,
});

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useContext(FirebaseContext).firebaseApp;
export const useAuth = () => useContext(FirebaseContext).auth as Auth;
export const useFirestore = () => useContext(FirebaseContext).firestore as Firestore;
export const useStorage = () => useContext(FirebaseContext).storage as FirebaseStorage;
export { useUser };


interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}

export function FirebaseProvider({ children, firebaseApp, auth, firestore, storage }: FirebaseProviderProps) {
  const contextValue = useMemo(() => ({
    firebaseApp,
    auth,
    firestore,
    storage,
  }), [firebaseApp, auth, firestore, storage]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList | undefined): T {
  return useMemo(factory, deps);
}
