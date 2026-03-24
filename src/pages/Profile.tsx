import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Package, Settings, LogOut, ChevronRight, Bell, ShieldCheck } from 'lucide-react';
import { AuthView } from '../components/AuthView';
import { LoadingScreen } from '../components/LoadingScreen';
 
export const Profile = () => {
  const { user, profile, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Swiggy Style: Split top actions into a grid to save vertical space
  const quickLinks = [
    { icon: Package, label: 'Orders', path: '/orders' },
    { icon: MapPin, label: 'Addresses', path: '/addresses' },
    { icon: Bell, label: 'Alerts', path: '/notifications' },
  ];

  // Subdued list for settings
  const listItems = [
    { icon: Settings, label: 'Account Settings', desc: 'Profile picture, name, and contact details', path: '/settings' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin Dashboard', desc: 'Manage orders, users, and products', path: '/admin' }] : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return <LoadingScreen text="Opening your profile..." />;
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] pb-32">
      {!user && <AuthView title="Join JORA BAKES" subtitle="Log in to track orders, save addresses, and earn loyalty points!" />}
      {/* Swiggy Style Unified Header & User Banner */}
      <div className="bg-white pt-10 pb-6 px-5 rounded-b-[32px] shadow-sm mb-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0">
              {profile?.photoURL || user?.photoURL ? (
                <img 
                  src={profile.photoURL || user.photoURL} 
                  alt={user?.displayName || 'Profile'} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-terracotta)] flex items-center justify-center text-white font-black text-3xl pb-1">
                  {(profile?.name || user?.displayName || 'G')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--color-chocolate)] tracking-tight mb-0.5">
                {user?.displayName || profile?.name || 'Jora Guest'}
              </h2>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                {profile?.phone || user?.phoneNumber || 'No phone added'}
              </p>
              <p className="text-xs font-medium text-gray-500">
                {user?.email || profile?.email || (user ? 'Phone User - Add email in Settings' : 'Login to manage your treats')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/settings')} 
            className="text-[var(--color-terracotta)] text-[10px] font-black uppercase tracking-wider bg-orange-50 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Space-Efficient Quick Links Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          {quickLinks.map((item, index) => (
            <button 
              key={item.label}
              onClick={() => navigate(item.path)}
              className="bg-white py-4 px-2 rounded-[24px] shadow-sm flex flex-col items-center justify-center gap-2.5 hover:bg-gray-50 transition-colors active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-orange-50 text-[var(--color-terracotta)] flex items-center justify-center">
                <item.icon size={20} />
              </div>
              <span className="text-[11px] font-bold text-gray-700">{item.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Detailed Options List */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[28px] shadow-sm overflow-hidden"
        >
          {listItems.map((item, index) => (
            <button 
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={`w-full flex items-center p-5 transition-colors hover:bg-gray-50 ${
                index !== listItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0 mr-4">
                <item.icon size={18} />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-sm text-[var(--color-chocolate)]">{item.label}</h4>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </motion.div>

        {/* Premium Logout Button */}
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleLogout}
          className="w-full bg-white flex justify-between items-center p-5 rounded-[24px] shadow-sm hover:bg-red-50 transition-colors group"
        >
          <span className="font-bold text-sm text-gray-700 group-hover:text-red-600 transition-colors">Log Out</span>
          <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
            <LogOut size={16} />
          </div>
        </motion.button>

        {/* App Info Footer to fill empty space */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 mb-6 text-center flex flex-col items-center"
        >
          <div className="w-12 h-1 bg-gray-200 rounded-full mb-6"></div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-center">
            <ShieldCheck size={12} /> Jora Bakes App v1.0.0
          </p>
          {user && user.metadata?.creationTime && (
            <p className="text-[11px] font-medium text-gray-400">
              Member since {new Date(user.metadata.creationTime).getFullYear()}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};
