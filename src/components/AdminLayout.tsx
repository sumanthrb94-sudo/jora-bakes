import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  LayoutDashboard,
  ArrowLeft,
  Command,
  ChefHat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToCollection } from '../services/firestore';
import { Order } from '../types';
import { CommandPalette } from './CommandPalette';

const navItems = [
  { path: '/admin', label: 'Hub', icon: <LayoutDashboard size={16} />, end: true },
  { path: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={16} /> },
  { path: '/admin/products', label: 'Products', icon: <Package size={16} /> },
];

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const prevCount = useRef(0);

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio alert failed', e);
    }
  };

  useEffect(() => {
    if (pendingCount > prevCount.current) {
      playNotificationSound();
    }
    prevCount.current = pendingCount;
  }, [pendingCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (data) => {
      const count = data.filter(o => o.status === 'pending').length;
      setPendingCount(count);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#1D1D1F] selection:text-white">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-50 shrink-0">
        <div className="h-14 flex items-center justify-between px-4 gap-3">
          {/* Left: Back + Brand */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100 hover:bg-gray-100 transition-colors">
              <ArrowLeft size={16} />
            </div>
            <div>
              <span className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-[0.1em] leading-none block">Jora Admin</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">Command Center</span>
            </div>
          </motion.div>

          {/* Center: Nav Pills */}
          <div className="flex bg-gray-100/80 p-1 rounded-2xl gap-0.5 overflow-x-auto hide-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${
                    isActive
                      ? 'bg-[#1D1D1F] text-white shadow-lg shadow-black/15'
                      : 'text-gray-400 hover:text-[#1D1D1F]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon}
                    {item.label}
                    {item.label === 'Orders' && pendingCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center ${
                          isActive ? 'bg-white text-[#1D1D1F]' : 'bg-red-500 text-white animate-pulse'
                        }`}
                      >
                        {pendingCount}
                      </motion.span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right: Command Palette Trigger */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsCommandOpen(true)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-xl text-gray-400 hover:text-[#1D1D1F] hover:bg-gray-200 transition-all"
          >
            <Command size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">⌘K</span>
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <motion.div
            key={typeof window !== 'undefined' ? window.location.pathname : ''}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
      />
    </div>
  );
};
