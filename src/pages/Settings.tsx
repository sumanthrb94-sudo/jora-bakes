import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, User, Phone, Mail, Camera, LogOut } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import toast from 'react-hot-toast';
import { UserProfile } from '../types';
import { motion } from 'framer-motion';

export const Settings = () => {
  const { profile, updateProfile, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    let photoURL = profile?.photoURL;
    
    if (imageFile) {
      try {
        const storageRef = ref(storage, `users/${user?.uid}/profile_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(snapshot.ref);
      } catch (err: unknown) {
        const uploadError = err as any;
        console.error("Image upload failed:", uploadError);
        toast.error(uploadError.message?.includes('permission') ? "Storage permission denied. Check Rules!" : "Failed to upload image.");
        setSaving(false);
        return; 
      }
    }

    try {
      const updateData: Partial<UserProfile> = { name, phone };
      if (photoURL) updateData.photoURL = photoURL;

      await updateProfile(updateData);
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err: unknown) {
      const error = err as any;
      console.error("Error updating profile:", error);
      toast.error(error.message?.includes('permission') ? "Database permission denied. Check Rules!" : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const currentAvatar = imageFile ? URL.createObjectURL(imageFile) : 
    (profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.displayName || 'Guest')}&background=ea580c&color=fff`);

  return (
    <div className="min-h-screen bg-[#f7f5f0] pb-32 font-sans selection:bg-[var(--color-terracotta)] selection:text-white">
      {/* Sticky Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center justify-between pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--color-chocolate)] hover:bg-orange-50 rounded-full transition-colors">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-black text-lg text-[var(--color-chocolate)] tracking-tight">Profile Settings</h1>
        <div className="w-10"></div> {/* Spacer for perfect centering */}
      </div>

      <div className="max-w-[428px] mx-auto">
        {/* Cover Graphic Block */}
        <div className="h-32 bg-gradient-to-br from-orange-200 to-[var(--color-terracotta)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
          {/* Decorative bakery shapes */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/20 blur-2xl rounded-full"></div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/20 blur-2xl rounded-full"></div>
        </div>

        <form onSubmit={handleSave} className="px-4 -mt-12 space-y-6">
          
          {/* Overlapping Avatar Editor */}
          <div className="flex flex-col items-center relative z-10">
            <div className="relative">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-28 h-28 rounded-full border-[5px] border-[#f7f5f0] shadow-xl overflow-hidden bg-white"
              >
                <img src={currentAvatar} alt="Profile" className="w-full h-full object-cover" />
              </motion.div>
              <label className="absolute bottom-1 right-1 w-8 h-8 bg-[var(--color-chocolate)] rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-gray-800 transition-colors border-2 border-[#f7f5f0]">
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setImageFile(e.target.files[0]) }} />
              </label>
            </div>
            <h2 className="mt-3 text-xl font-black text-[var(--color-chocolate)]">{profile?.name || 'Guest'}</h2>
            <p className="text-[10px] font-bold text-[var(--color-terracotta)] uppercase tracking-widest bg-orange-100/50 px-2 py-0.5 rounded-sm mt-1">{profile?.role}</p>
          </div>

          {/* Form Fields Unified Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-5 space-y-3">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Personal Details</h3>
              
              {/* Name Field */}
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-terracotta)] transition-colors" />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                  placeholder="Your Full Name"
                />
              </div>

              {/* Phone Field */}
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[var(--color-terracotta)] transition-colors" />
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-[var(--color-chocolate)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] transition-all"
                  placeholder="Mobile Number"
                />
              </div>

              {/* Email Field (Readonly visually locked) */}
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={user?.email || profile?.email || ''}
                  disabled
                  className="w-full bg-gray-100/70 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-gray-400 cursor-not-allowed"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1 shadow-sm">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Core Action Save Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button 
              type="submit"
              disabled={saving || (!name || !phone)}
              className="w-full bg-[var(--color-terracotta)] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98] h-[56px]"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Save Changes</>
              )}
            </button>
          </motion.div>
        </form>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.2 }} 
          className="px-4 mt-8 space-y-3 mb-8"
        >
           <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Danger Zone</h3>
           <button 
             type="button"
             onClick={async () => {
               await logout();
               navigate('/');
             }}
             className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold text-sm border-2 border-transparent hover:border-red-100 hover:bg-red-100/50 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
           >
             <LogOut size={18} />
             Sign Out
           </button>
        </motion.div>

      </div>
    </div>
  );
};