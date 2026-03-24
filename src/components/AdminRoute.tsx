import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  // ProtectedRoute already handles loading + unauthenticated state
  return (
    <ProtectedRoute>
      {isAdmin ? <>{children}</> : <Navigate to="/" replace />}
    </ProtectedRoute>
  );
};
