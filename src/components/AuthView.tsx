import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, ChevronLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

interface AuthViewProps {
  title?: string;
  subtitle?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({ 
  title = "Welcome to JORA BAKES", 
  subtitle = "Log in or sign up to explore artisanal treats" 
}) => {
  const { login, loginEmail, registerEmail } = useAuth();
  const navigate = useNavigate();
  
  // Auth Modes: 'phone' (default Swiggy style) or 'email'
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Phone OTP States
  const [phoneInput, setPhoneInput] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    // Cleanup recaptcha on unmount
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch(e) {
          console.warn("Recaptcha teardown safely ignored", e);
        }
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);

  const initializeRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    setIsLoading(true);
    try {
      initializeRecaptcha();
      const formattedPhone = phoneInput.startsWith('+') ? phoneInput : `+91${phoneInput}`;
      const appVerifier = (window as any).recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setShowOtp(true);
      toast.success('OTP sent successfully!');
    } catch (error: any) {
      console.error("OTP Error:", error);
      toast.error(`OTP Error: ${error.code || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success('Logged in successfully!');
    } catch (error: any) {
      console.error("Verify Error:", error);
      toast.error('Invalid OTP. Please check and try again.');
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
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
      else msg = `Firebase Error: ${error.code}`; // Force the real error to show!
      toast.error(msg, { duration: 4000 });
    } finally {
      setIsLoading(false);
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex justify-center pointer-events-none selection:bg-[var(--color-terracotta)] selection:text-white">
      <div className="w-full max-w-[428px] h-full relative pointer-events-auto flex flex-col justify-end sm:justify-center p-0 sm:p-4 overflow-hidden">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"></div>
      <motion.div 
        initial={{ y: '100%', opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full sm:max-w-md mx-auto bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl relative max-h-[92vh] overflow-y-auto pb-safe flex flex-col z-10"
      >
        {/* Close Button */}
        <button 
          onClick={() => window.history.length > 2 ? navigate(-1) : navigate('/')}
          className="absolute top-6 right-6 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-[var(--color-terracotta)] transition-colors z-20"
        >
          <X size={18} />
        </button>

        <div className="p-8 pt-10">
          {/* Dynamic Header Section */}
          <div className="flex justify-between items-start mb-10">
            <div>
              {authMode === 'phone' && !showOtp && (
                <>
                  <h1 className="text-3xl font-black text-[var(--color-chocolate)] tracking-tight mb-2">Login</h1>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">Enter your phone number to proceed</p>
                </>
              )}
              {authMode === 'phone' && showOtp && (
                <>
                  <h1 className="text-3xl font-black text-[var(--color-chocolate)] tracking-tight mb-2">Verify Details</h1>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">OTP sent to +91 {phoneInput}</p>
                </>
              )}
              {authMode === 'email' && !isSignUp && (
                <>
                  <h1 className="text-3xl font-black text-[var(--color-chocolate)] tracking-tight mb-2">Login</h1>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">Enter your email and password</p>
                </>
              )}
              {authMode === 'email' && isSignUp && (
                <>
                  <h1 className="text-3xl font-black text-[var(--color-chocolate)] tracking-tight mb-2">Create Account</h1>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed">Join us for delightful treats</p>
                </>
              )}
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[var(--color-terracotta)] shrink-0">
              {authMode === 'phone' ? <Phone size={24} /> : <User size={24} />}
            </div>
          </div>

          {/* Form Section */}
          {authMode === 'phone' ? (
            showOtp ? (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <input
                  type="text"
                  placeholder="6-digit OTP"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-center tracking-[0.5em] text-xl font-bold text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                />
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[var(--color-terracotta)] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[56px]"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Verify & Proceed'}
                  </button>
                  <button type="button" onClick={() => setShowOtp(false)} className="w-full py-4 text-sm font-bold text-gray-500 hover:text-[var(--color-chocolate)] transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft size={18} /> Go back
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="flex bg-gray-50 border border-gray-100 rounded-2xl focus-within:bg-white focus-within:ring-2 focus-within:ring-[var(--color-terracotta)] transition-all overflow-hidden">
                  <span className="flex items-center justify-center pl-5 pr-2 font-bold text-gray-500 text-sm border-r border-gray-200 my-3">+91</span>
                  <input
                    type="tel"
                    placeholder="Mobile Number"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent px-3 py-4 text-sm font-bold text-[var(--color-chocolate)] focus:outline-none placeholder:font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[var(--color-terracotta)] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-between items-center px-6 mt-2 group h-[56px]"
                >
                  <span className="w-full text-center">{isLoading ? 'Sending OTP...' : 'Continue'}</span>
                </button>

                <div className="flex items-center gap-4 pt-2">
                  <div className="h-px bg-gray-100 flex-1"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">or</span>
                  <div className="h-px bg-gray-100 flex-1"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading || isGoogleLoading}
                    className="bg-white text-gray-700 border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isGoogleLoading ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" /> Google</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('email')}
                    disabled={isLoading || isGoogleLoading}
                    className="bg-white text-gray-700 border-2 border-gray-100 py-3.5 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <Mail size={16} className="text-gray-500" /> Email
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 text-center pt-4 leading-relaxed">
                  By continuing, you agree to our <br/><span className="underline cursor-pointer hover:text-gray-600">Terms of Service</span> & <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>
                </p>
              </form>
            )
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div 
                      key="signup-fields"
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <input 
                        type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                      />
                      <input 
                        type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <input 
                  type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                />
                <input 
                  type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-medium text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                />
                
                <button 
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full bg-[var(--color-terracotta)] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[56px] mt-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    isSignUp ? 'Sign Up' : 'Login'
                  )}
                </button>
              </form>

              <div className="text-center text-sm text-gray-500 font-medium">
                {isSignUp ? 'Already have an account?' : 'New to JORA BAKES?'}
                <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-[var(--color-terracotta)] font-bold hover:underline focus:outline-none">
                  {isSignUp ? 'Login here' : 'Create account'}
                </button>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <div className="h-px bg-gray-100 flex-1"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">or</span>
                <div className="h-px bg-gray-100 flex-1"></div>
              </div>

              <button
                onClick={() => {
                  setAuthMode('phone');
                  setIsSignUp(false);
                }}
                className="w-full bg-white text-gray-700 border-2 border-gray-100 py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 h-[56px]"
              >
                <Phone size={18} className="text-gray-500" /> Continue with Phone Number
              </button>
            </div>
          )}
          
          {/* Invisible Recaptcha Container for Firebase Phone Auth */}
          <div id="recaptcha-container" className="absolute bottom-0 opacity-0 pointer-events-none"></div>
        </div>
      </motion.div>
      </div>
    </div>,
    document.body
  );
};