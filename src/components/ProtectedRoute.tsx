import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthView } from './AuthView';
import { LoadingScreen } from './LoadingScreen';
import { CompleteProfileView } from './CompleteProfileView';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen text="Preparing your experience..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] pb-32">
        <AuthView />
      </div>
    );
  }

  // Intercept users with incomplete profiles
  const isProfileIncomplete = user && profile && (
    !profile.name || 
    profile.name.trim() === '' || 
    profile.name === 'JORA BAKES Guest' || 
    !profile.email || 
    profile.email.trim() === '' || 
    !profile.phone || 
    profile.phone.trim() === ''
  );

  if (isProfileIncomplete) {
    return <CompleteProfileView />;
  }

  return <>{children}</>;
};
