import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Removed unused imports
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// This configuration includes the project ID "gen-lang-client-0753950904"
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "gen-lang-client-0753950904.firebaseapp.com",
  projectId: "gen-lang-client-0753950904",
  storageBucket: "gen-lang-client-0753950904.firebasestorage.app",
  messagingSenderId: "20483674637",
  appId: "1:20483674637:web:d75741d6023f8e517bbb44",
  firestoreDatabaseId: "ai-studio-b35406e0-0fe9-4f0d-a34d-b78e3c5d10cf"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = async () => {
  try {
    // Using Popup instead of Redirect to bypass strict mobile browser cookie blocking
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    console.error("Error logging in with Google:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: unknown) {
    console.error("Error registering with email:", error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error: unknown) {
    console.error("Error logging in with email:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    console.error("Error logging out:", error);
    throw error;
  }
};
