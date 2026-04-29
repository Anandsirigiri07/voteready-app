import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

let app, auth, db;

try {
  const res = await fetch('/api/config/firebase');
  const firebaseConfig = await res.json();

  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous auth failed:", error);
    });
  } else {
    throw new Error("No API Key");
  }
} catch (e) {
  console.warn("FIREBASE IS NOT CONFIGURED! Using LocalStorage mock for UI to function fully.");
  
  // Mock Auth
  auth = { currentUser: { uid: 'local-user-123' } };
  
  // Mock DB using LocalStorage
  db = { isMock: true };
}

// Export mock objects if Firebase failed to initialize
export { auth, db };
