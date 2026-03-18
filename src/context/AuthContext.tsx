import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User as FirebaseUser, onAuthStateChanged, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, loginWithGoogle, logout as firebaseLogout, loginWithEmail as firebaseLoginEmail, registerWithEmail as firebaseRegisterEmail } from '../firebase';
import { getDocument, createDocument, updateDocument } from '../services/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { NotificationService } from '../services/NotificationService';
import { UserProfile, Address } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string, name?: string, phone?: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Add any new admin email addresses to this list inside the quotes
const ADMIN_EMAILS = ['sumanthbolla97@gmail.com', 'sumanthrb94@gmail.com', 'newadmin@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let notificationUnsubscribe: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        console.log("Auth state changed: User logged in. UID:", firebaseUser.uid);
        // Fetch or create profile
        try {
          console.log("Attempting to fetch profile for UID:", firebaseUser.uid);
          let userProfile = await getDocument<UserProfile>('users', firebaseUser.uid);
          if (!userProfile) {
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'JORA BAKES Guest',
              role: ADMIN_EMAILS.includes(firebaseUser.email || '') ? 'admin' : 'customer',
              points: 0,
              createdAt: new Date().toISOString(),
            };
            await createDocument('users', newProfile, firebaseUser.uid);
            userProfile = newProfile;
          }
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to fetch profile, using fallback:", err);
          let fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'JORA BAKES Guest',
            role: ADMIN_EMAILS.includes(firebaseUser.email || '') ? 'admin' : 'customer',
            points: 0,
            createdAt: new Date().toISOString(),
          };
          setProfile(fallbackProfile);
          userProfile = fallbackProfile; // ensure notifications initialize properly
        }

        // Initialize Notifications
        try {
          NotificationService.requestPermission();
          const isAdminUser = userProfile?.role === 'admin' || ADMIN_EMAILS.includes(firebaseUser.email || '');
          notificationUnsubscribe = NotificationService.listenToOrderUpdates(firebaseUser.uid, isAdminUser);
        } catch (err) {
          console.warn("Notification service failed to initialize:", err);
        }
      } else {
        setProfile(null);
        if (notificationUnsubscribe) {
          notificationUnsubscribe();
          notificationUnsubscribe = undefined;
        }
      }
      setLoading(false);
    });
    return () => {
      unsubscribe();
      if (notificationUnsubscribe) notificationUnsubscribe();
    };
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    await firebaseLoginEmail(email, pass);
  };

  const registerEmail = async (email: string, pass: string, name?: string, phone?: string) => {
    const user = await firebaseRegisterEmail(email, pass);
    if (user && (name || phone)) {
      if (name) {
        await updateFirebaseProfile(user, { displayName: name }).catch(console.error);
      }
      const updateData: Partial<UserProfile> = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      setProfile(prev => prev ? { ...prev, ...updateData } : null);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await updateDocument('users', user.uid, data);
    setProfile(prev => prev ? { ...prev, ...data } : null);
  };

  const isAdmin = profile?.role === 'admin';

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    login,
    logout,
    loginEmail,
    registerEmail,
    updateProfile,
    isAdmin
  }), [user, profile, loading, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
