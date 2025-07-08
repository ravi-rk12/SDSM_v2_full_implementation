// src/lib/firebase/config.ts - This is your ONLY Firebase config file
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Use getFirestore
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Only if you use Analytics
};

// Initialize Firebase App - ensuring it's only done once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Get Firestore instance - ensuring we get an existing instance
const db = getFirestore(app);

// Get Auth instance - ensuring we get an existing instance
const auth = getAuth(app);

export { app, db, auth };
