
'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);


// Centralized initialization function
export const initializeFirebase = () => {
    return {
        firebaseApp,
        auth,
        firestore,
        storage
    };
};

// Export hooks and providers
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore, useStorage, useMemoFirebase } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { firebaseApp, auth, firestore, storage };
