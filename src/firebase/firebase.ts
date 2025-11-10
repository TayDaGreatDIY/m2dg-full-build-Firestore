// src/firebase/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./config"; // Assuming config exports default

// Initialize Firebase app
const app = !getApps().length ? initializeApp({}) : getApp(); // Pass empty config initially

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export default app (optional)
export default app;
