import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, Package, Settings, LogOut, ChevronRight, Star, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
 
export const Profile = () => {
  const { user, profile, loading, login, logout, isAdmin, loginEmail, registerEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const menuItems = [
    { icon: Package, label: 'My Orders', desc: 'Track, return, or buy things again', path: '/orders' },
    { icon: Bell, label: 'Notifications', desc: 'Order updates and alerts', path: '/notifications' },
    { icon: MapPin, label: 'Saved Addresses', desc: 'Manage delivery locations', path: '/addresses' },
    { icon: Settings, label: 'Account Settings', desc: 'Password, notifications, preferences', path: '/settings' },
    ...(isAdmin ? [{ icon: User, label: 'Admin Dashboard', desc: 'Manage orders, users, and products', path: '/admin' }] : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await login();
    } catch (error) {
      setIsGoogleLoading(false);
      toast.error("Google login failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)]">
        <div className="text-[var(--color-terracotta)] font-script text-2xl animate-pulse">
          Opening your profile...
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
          
          <h1 className="font-script text-5xl text-[var(--color-chocolate)] mb-4">Join JORA BAKES 's Circle</h1>
          
          <p className="text-[var(--color-chocolate)] opacity-70 text-base leading-relaxed mb-8 w-full">
            Log in to track orders, save addresses, and earn loyalty points for free treats!
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

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4">
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Profile</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* User Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm flex items-center gap-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-sage)] opacity-10 rounded-bl-full" />
          
          <div className="w-16 h-16 bg-[var(--color-beige)] rounded-full flex items-center justify-center text-[var(--color-terracotta)] shrink-0 border-2 border-[var(--color-cream)] overflow-hidden">
            {(profile?.photoURL || user.photoURL) ? (
              <img src={profile?.photoURL || user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
            ) : (
              <User size={32} />
            )}
          </div>
          
          <div className="flex-1 z-10">
            <h2 className="text-xl font-bold text-[var(--color-chocolate)] mb-1">{user.displayName}</h2>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden"
        >
          {menuItems.map((item, index) => (
            <button 
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={`w-full flex items-center p-4 transition-colors hover:bg-gray-50 ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[var(--color-beige)] flex items-center justify-center text-[var(--color-terracotta)] shrink-0 mr-4">
                <item.icon size={20} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-[var(--color-chocolate)] text-sm">{item.label}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-semibold text-sm bg-white rounded-2xl shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Log Out
        </motion.button>
      </div>
    </div>
  );
};
