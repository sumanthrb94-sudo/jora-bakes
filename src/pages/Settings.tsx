import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, User, Phone, Mail, Camera } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import toast from 'react-hot-toast';
import { UserProfile } from '../types';

export const Settings = () => {
  const { profile, updateProfile, user } = useAuth();
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
        return; // Stop execution here
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

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Account Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                {(imageFile || profile?.photoURL || user?.photoURL) ? (
                  <img 
                    src={imageFile ? URL.createObjectURL(imageFile) : (profile?.photoURL || user?.photoURL)} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User size={40} className="text-gray-400" />
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer text-white">
                  <Camera size={24} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">Tap to change picture</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <User size={14} /> Full Name
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                placeholder="Your Name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Phone size={14} /> Phone Number
              </label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Mail size={14} /> Email Address
              </label>
              <input 
                type="email" 
                value={user?.email || profile?.email || ''}
                disabled
                className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400 mt-1">Email address cannot be changed.</p>
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full mt-6 bg-[var(--color-chocolate)] text-[var(--color-cream)] py-3 rounded-xl font-bold text-sm shadow-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 h-11"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-[var(--color-cream)] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};