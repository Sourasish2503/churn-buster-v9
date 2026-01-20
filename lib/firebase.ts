import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Config Object
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Handle newlines in private keys (crucial for Vercel)
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

// Track initialization state
let firebaseInitialized = false;

// Initialize ONLY if not already running
if (!getApps().length) {
  if (firebaseAdminConfig.privateKey && firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail) {
    try {
      initializeApp({
        credential: cert(firebaseAdminConfig),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin Connected");
    } catch (error) {
      console.error("Firebase Init Error:", error);
      firebaseInitialized = false;
    }
  } else {
    // Log warning during build instead of crashing
    console.warn("Firebase skipped: Missing required configuration (projectId, clientEmail, or privateKey)");
  }
} else {
  firebaseInitialized = true;
}

// Export the Database instance with proper typing
// Returns null if Firebase is not configured - callers must check for null
export const db: Firestore | null = firebaseInitialized && getApps().length ? getFirestore() : null;

// Helper to check if Firebase is available
export function isFirebaseConfigured(): boolean {
  return db !== null;
}