import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, login } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)]">
        <div className="text-[var(--color-terracotta)] font-script text-2xl animate-pulse">
          Zora is preparing your experience...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-beige)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-full max-w-[320px] flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[var(--color-terracotta)] mb-8 shadow-sm border-4 border-white">
            <User size={40} />
          </div>
          
          <h1 className="font-script text-5xl text-[var(--color-chocolate)] mb-4">Welcome to Zora</h1>
          
          <p className="text-[var(--color-chocolate)] opacity-70 text-lg leading-relaxed mb-12 w-full">
            Sign in to explore our artisanal treats and manage your curated orders.
          </p>
          
          <button 
            onClick={login}
            className="w-full bg-[var(--color-terracotta)] text-white py-5 rounded-full font-bold text-lg shadow-xl hover:bg-[var(--color-chocolate)] transition-all transform active:scale-95 flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
            Sign In with Google
          </button>
          
          <p className="mt-12 text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
            Handcrafted with love
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
