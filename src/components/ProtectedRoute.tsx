import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthView } from './AuthView';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
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

  return <>{children}</>;
};
