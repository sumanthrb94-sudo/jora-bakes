import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, login, loginEmail, registerEmail } = useAuth();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    try {
      if (isSignUp) {
        await registerEmail(email, password);
      } else {
        await loginEmail(email, password);
      }
    } catch (error: any) {
      let msg = "Authentication failed";
      if (error.code === 'auth/invalid-credential') msg = "Invalid email or password";
      else if (error.code === 'auth/email-already-in-use') msg = "Email is already in use";
      else if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters";
      toast.error(msg);
    }
  };

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
    return (
      <div className="min-h-screen bg-[var(--color-beige)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-full max-w-[320px] flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-[var(--color-terracotta)] mb-8 shadow-sm border-4 border-white">
            <User size={40} />
          </div>
          
          <h1 className="font-script text-5xl text-[var(--color-chocolate)] mb-4">Welcome to JORA BAKES </h1>
          
          <p className="text-[var(--color-chocolate)] opacity-70 text-base leading-relaxed mb-8 w-full">
            Sign in to explore our artisanal treats and manage your curated orders.
          </p>
          
          <form onSubmit={handleEmailAuth} className="w-full space-y-3 mb-6">
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
            />
            <button 
              type="submit"
              className="w-full bg-[var(--color-chocolate)] text-[var(--color-cream)] py-3 rounded-xl font-bold text-sm shadow-md hover:bg-opacity-90 transition-all mt-2"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-gray-500 hover:text-[var(--color-terracotta)] mt-2"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
          
          <div className="relative w-full mb-6 flex items-center justify-center">
            <div className="border-t border-gray-300 w-full absolute"></div>
            <span className="bg-[var(--color-beige)] px-3 text-xs text-gray-400 relative z-10 font-medium tracking-wider">OR</span>
          </div>

          <button 
            onClick={login}
            className="w-full bg-white text-[var(--color-chocolate)] border border-gray-200 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all transform active:scale-95 flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
