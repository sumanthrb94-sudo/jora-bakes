import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const CompleteProfileView: React.FC = () => {
  const { profile, updateProfile, logout } = useAuth();
  
  const [name, setName] = useState(profile?.name === 'JORA BAKES Guest' ? '' : (profile?.name || ''));
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [isLoading, setIsLoading] = useState(false);

  const isNameMissing = !profile?.name || profile?.name === 'JORA BAKES Guest';
  const isEmailMissing = !profile?.email;
  const isPhoneMissing = !profile?.phone;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNameMissing && !name.trim()) return toast.error("Please enter your name");
    if (isEmailMissing && !email.trim()) return toast.error("Please enter your email");
    if (isPhoneMissing && (!phone.trim() || phone.length < 10)) return toast.error("Please enter a valid phone number");

    setIsLoading(true);
    try {
      // Update the user's Firestore profile
      await updateProfile({
        ...(isNameMissing && { name: name.trim() }),
        ...(isEmailMissing && { email: email.trim() }),
        ...(isPhoneMissing && { phone: phone.trim() }),
      });
      toast.success("Profile completed successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-center bg-[#e5e5e5] sm:bg-black/50 sm:backdrop-blur-sm selection:bg-[var(--color-terracotta)] selection:text-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-[428px] h-[100dvh] bg-white shadow-2xl relative overflow-y-auto flex flex-col z-10"
      >
        <div className="h-[20vh] min-h-[160px] w-full relative bg-[var(--color-bg-primary)] flex items-center justify-center shrink-0 border-b border-[var(--color-border-subtle)]">
          <h1 className="text-4xl font-black text-[var(--color-chocolate)] tracking-tighter">JORA BAKES</h1>
        </div>

        <div className="px-8 pb-8 pt-8 flex-1 flex flex-col relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-[var(--color-chocolate)] tracking-tight mb-2">Almost there!</h1>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Please complete your profile to continue exploring our artisanal treats.
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[var(--color-terracotta)] shrink-0 shadow-sm border border-orange-100">
              <CheckCircle2 size={24} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {isNameMissing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Jane Doe" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-5 py-4 text-sm font-bold text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {isEmailMissing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email" 
                      placeholder="jane@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-5 py-4 text-sm font-bold text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                    />
                  </div>
                </motion.div>
              )}

              {isPhoneMissing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Mobile Number</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="tel" 
                      placeholder="+91 9999999999" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-5 py-4 text-sm font-bold text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--color-terracotta)] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98] disabled:opacity-70 flex justify-center items-center h-[56px] mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Save & Continue'
              )}
            </button>
            
            <button 
              type="button"
              onClick={() => logout()}
              className="w-full py-4 text-sm font-bold text-gray-400 hover:text-[var(--color-chocolate)] transition-colors text-center"
            >
              Log out
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
