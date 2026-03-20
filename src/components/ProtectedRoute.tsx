import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthView } from './AuthView';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)]">
        <div className="text-[var(--color-terracotta)] font-script text-2xl animate-pulse"> 
          JORA BAKES is preparing your experience...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return <>{children}</>;
};
