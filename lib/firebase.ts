// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNpo3I7cl0gi2UFCCNBduCh8N05KUh6hQ",
  authDomain: "smart-recipe-finder-b7c5e.firebaseapp.com",
  projectId: "smart-recipe-finder-b7c5e",
  storageBucket: "smart-recipe-finder-b7c5e.firebasestorage.app",
  messagingSenderId: "157537056076",
  appId: "1:157537056076:web:f53d1bd032e2069d6132e3"
};

// ป้องกันการ Initialize ซ้ำซ้อน
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);