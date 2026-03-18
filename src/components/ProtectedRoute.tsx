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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    if (isSignUp && (!name || !phone)) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    setIsEmailLoading(true);
    try {
      if (isSignUp) {
        await registerEmail(email, password, name, phone);
      } else {
        await loginEmail(email, password);
      }
    } catch (error: any) {
      let msg = "Authentication failed";
      if (error.code === 'auth/invalid-credential') msg = "Invalid email or password";
      else if (error.code === 'auth/email-already-in-use') msg = "Email is already in use";
      else if (error.code === 'auth/weak-password') msg = "Password should be at least 6 characters";
      toast.error(msg);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await login();
    } catch (error) {
      toast.error("Google login failed.");
    } finally {
      setIsGoogleLoading(false);
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
            {isSignUp && (
              <>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                />
              </>
            )}
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
              disabled={isEmailLoading || isGoogleLoading}
              className="w-full bg-[var(--color-chocolate)] text-[var(--color-cream)] py-3 rounded-xl font-bold text-sm shadow-md hover:bg-opacity-90 transition-all mt-2 disabled:opacity-70 flex justify-center items-center h-11"
            >
              {isEmailLoading ? (
                <div className="w-5 h-5 border-2 border-[var(--color-cream)] border-t-transparent rounded-full animate-spin" />
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
            <button 
              type="button" 
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isEmailLoading || isGoogleLoading}
              className="text-xs text-gray-500 hover:text-[var(--color-terracotta)] mt-2 disabled:opacity-50"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
          
          <div className="relative w-full mb-6 flex items-center justify-center">
            <div className="border-t border-gray-300 w-full absolute"></div>
            <span className="bg-[var(--color-beige)] px-3 text-xs text-gray-400 relative z-10 font-medium tracking-wider">OR</span>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={isEmailLoading || isGoogleLoading}
            className="w-full bg-white text-[var(--color-chocolate)] border border-gray-200 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition-all transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 h-11"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-[var(--color-chocolate)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 bg-white rounded-full p-0.5" />
                Continue with Google
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
