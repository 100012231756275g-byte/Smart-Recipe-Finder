// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBnpO3i7C10gi2UFCCNBDucH8NO5KUhQhQ",
  authDomain: "smart-recipe-finder-b7c5e.firebaseapp.com",
  projectId: "smart-recipe-finder-b7c5e",
  storageBucket: "smart-recipe-finder-b7c5e.firebasestorage.app",
  messagingSenderId: "152532056026",
  appId: "1:152532056026:web:f53d1bd032e2069d6132e3"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);