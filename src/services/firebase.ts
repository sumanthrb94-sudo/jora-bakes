import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// Replace with your actual Firebase project configuration from your Firebase project settings
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // <<< REPLACE THIS WITH YOUR ACTUAL API KEY
  authDomain: "gen-lang-client-0753950904.firebaseapp.com",
  projectId: "gen-lang-client-0753950904",
  storageBucket: "gen-lang-client-0753950904.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // <<< REPLACE THIS WITH YOUR ACTUAL MESSAGING SENDER ID
  appId: "YOUR_APP_ID" // <<< REPLACE THIS WITH YOUR ACTUAL APP ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);