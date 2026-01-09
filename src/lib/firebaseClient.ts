import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Config di Gemini
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBA49BgwP9lWxzbOibILF8m-fkgHUySpkE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gemini-gpt-fd445.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gemini-gpt-fd445",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gemini-gpt-fd445.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "449348437250",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:449348437250:web:a6c0c2845f9dddcb7b2e1b",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-3PJKGWJQYK",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Attenzione: specificare il bucket corretto con .firebasestorage.app
export const storage = getStorage(app, "gs://gemini-gpt-fd445.firebasestorage.app");
