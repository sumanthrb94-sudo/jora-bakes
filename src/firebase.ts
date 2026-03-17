import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'; // Removed unused imports
import { getFirestore } from 'firebase/firestore'; // Removed unused imports

// Your web app's Firebase configuration
// This configuration includes the project ID "gen-lang-client-0753950904"
const firebaseConfig = {
  apiKey: "AIzaSyC_ciJWsHoUvBHEkeUOUZ-Buq6wnX-tnGw",
  authDomain: "gen-lang-client-0753950904.firebaseapp.com",
  projectId: "gen-lang-client-0753950904",
  storageBucket: "gen-lang-client-0753950904.firebasestorage.app",
  messagingSenderId: "20483674637",
  appId: "1:20483674637:web:d75741d6023f8e517bbb44",
  firestoreDatabaseId: "ai-studio-b35406e0-0fe9-4f0d-a34d-b78e3c5d10cf" // Retained from firebase-applet-config.json
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};
