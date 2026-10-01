import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';
import { getFunctions, Functions } from 'firebase/functions';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// CRITICAL: Validate all required environment variables before initialization
const validateFirebaseConfig = (): boolean => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  
  // All required fields must be present and non-empty
  if (!apiKey || !authDomain || !projectId) {
    console.error('Firebase configuration is incomplete. Required environment variables missing.');
    return false;
  }
  
  // Check for placeholder values that indicate missing config
  const placeholders = ['your-api-key', 'your-project-id', '', null, undefined];
  if (apiKey && placeholders.includes(apiKey)) {
    console.error('Firebase API key appears to be a placeholder. Please configure your Firebase project.');
    return false;
  }
  
  return true;
};

// CRITICAL: Proper error handling for Firebase initialization
let appInstance: any = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let functionsInstance: Functions | null = null;
let storageInstance: FirebaseStorage | null = null;

try {
  // Check if Firebase is already initialized
  const existingApps = getApps();
  
  if (existingApps.length > 0) {
    appInstance = existingApps[0];
    authInstance = getAuth(appInstance);
    try {
      dbInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch {
      dbInstance = getFirestore(appInstance);
    }
    try {
      functionsInstance = getFunctions(appInstance);
    } catch (fnErr) {
      console.warn('Functions initialization failed:', fnErr);
    }
    try {
      storageInstance = getStorage(appInstance);
    } catch (storageErr) {
      console.warn('Storage initialization failed (VITE_FIREBASE_STORAGE_BUCKET missing?):', storageErr);
    }
  } else if (validateFirebaseConfig()) {
    appInstance = initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    });
    
    // Initialize Auth with proper error handling
    try {
      authInstance = getAuth(appInstance);

      // Initialize Firestore with persistent cache
      try {
        dbInstance = initializeFirestore(appInstance, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      } catch {
        dbInstance = getFirestore(appInstance);
      }

      // Initialize Firebase Functions
      try {
        functionsInstance = getFunctions(appInstance);
      } catch (fnErr) {
        console.warn('Functions init warning:', fnErr);
      }

      // Cloud Storage holds meal photos (see src/lib/mealPhotoStorage.ts)
      try {
        storageInstance = getStorage(appInstance);
      } catch (storageErr) {
        console.warn('Storage init warning:', storageErr);
      }
    } catch (authError) {
      console.error('Failed to initialize Firebase Auth:', authError);
      authInstance = null;
    }
  } else {
    console.warn('Firebase configuration validation failed. App will not function properly.');
  }
} catch (initError) {
  console.error('Critical error during Firebase initialization:', initError);
  // Set all services to null on critical failure
  appInstance = null;
  authInstance = null;
  dbInstance = null;
  functionsInstance = null;
  storageInstance = null;
}

// Export with proper null checks and validation
export const getFirebaseServices = (): { 
  app: any, 
  auth: Auth | null, 
  db: Firestore | null,
  functions: Functions | null,
  storage: FirebaseStorage | null
} => {
  if (!validateFirebaseConfig()) {
    console.error('Firebase configuration is invalid. Services are not available.');
    return { app: null, auth: null, db: null, functions: null, storage: null };
  }
  
  // Validate all services exist before returning
  if (!appInstance) {
    console.error('Firebase app is not initialized.');
    return { app: null, auth: null, db: null, functions: null, storage: null };
  }
  
  if (!authInstance) {
    console.warn('Firebase Auth is not initialized. User operations will fail.');
  }
  
  if (!dbInstance) {
    console.error('Firestore database is not initialized.');
  }
  
  return { app: appInstance, auth: authInstance, db: dbInstance, functions: functionsInstance, storage: storageInstance };
};

// Backward compatibility exports (with null checks).
// Resolved once: calling the getter per export re-ran the config validation and
// re-logged the same failure four times at module load.
const services = getFirebaseServices();
export const app = services.app;
export const auth = services.auth;
export const db = services.db;
export const functions = services.functions;
export const storage = services.storage;

