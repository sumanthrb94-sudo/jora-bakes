import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logout as firebaseLogout } from '../firebase';
import { getDocument, createDocument, updateDocument } from '../services/firestore';
import { NotificationService } from '../services/NotificationService';
import { UserProfile, Address } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
              role: firebaseUser.email === 'sumanthbolla97@gmail.com' ? 'admin' : 'customer',
              points: 0,
              createdAt: new Date().toISOString(),
            };
            await createDocument('users', newProfile, firebaseUser.uid);
            userProfile = newProfile;
          }
          setProfile(userProfile);
        } catch (err) {
          console.error("Failed to fetch profile, using fallback:", err);
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'JORA BAKES Guest',
            role: firebaseUser.email === 'sumanthbolla97@gmail.com' ? 'admin' : 'customer',
            points: 0,
            createdAt: new Date().toISOString(),
          });
        }

        // Initialize Notifications
        try {
          NotificationService.requestPermission();
          const isAdminUser = firebaseUser.email === 'sumanthbolla97@gmail.com';
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
