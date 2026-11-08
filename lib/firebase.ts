import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

/**
 * The project comes from NEXT_PUBLIC_FIREBASE_* at build time (see .env.local.example).
 * Without them it uses the Code Rama project below (code-rama-6826d, Firestore in Bangkok).
 * A web Firebase config is public by design: access is controlled by firestore.rules.
 * NEXT_PUBLIC_FIREBASE_EMULATOR=1 points everything at the local emulators for testing.
 */
// Each variable is written out in full: Next.js only fills in literal process.env.NEXT_PUBLIC_* references
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  ? {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
  : {
      apiKey: "AIzaSyCdRygOVnMFY6b5gGC9R5468Hi8nw9yNSs",
      authDomain: "code-rama-6826d.firebaseapp.com",
      projectId: "code-rama-6826d",
      storageBucket: "code-rama-6826d.firebasestorage.app",
      messagingSenderId: "644643343483",
      appId: "1:644643343483:web:27aadb47e35bca4fa526de",
    };

export const usingEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1";

// Avoid re-initializing the app on hot reloads / multiple imports
const fresh = !getApps().length;
const app: FirebaseApp = fresh ? initializeApp(firebaseConfig) : getApp();
const auth: Auth = getAuth(app);
const db = getFirestore(app);
if (fresh && usingEmulator && typeof window !== "undefined") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export { app, auth, db };
