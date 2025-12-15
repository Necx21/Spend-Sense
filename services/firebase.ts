import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// ------------------------------------------------------------------
// ⚠️ IMPORTANT: REPLACE THE VALUES BELOW WITH YOUR FIREBASE CONFIG
// Get this from: Firebase Console > Project Settings > General
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "replace-with-your-project.firebaseapp.com",
  projectId: "replace-with-your-project",
  storageBucket: "replace-with-your-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000000000"
};

// Initialize Firebase only if config is valid to prevent crashes
let app;
let auth;

try {
    if (firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        console.log("Firebase initialized successfully.");
    } else {
        console.warn("Firebase Config missing. Running in Mock Mode.");
    }
} catch (e) {
    console.error("Firebase initialization failed:", e);
}

export { auth };