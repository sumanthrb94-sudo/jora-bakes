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
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#D26E4B] selection:text-white">
      {/* Top Header */}
      <header className="bg-[#FAF7F2]/80 backdrop-blur-xl border-b border-[#E8E2D9] sticky top-0 z-50 shrink-0">
        <div className="h-14 flex items-center justify-between px-4 gap-3">
          {/* Left: Back + Brand */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-white border border-[#E8E2D9] rounded-xl flex items-center justify-center text-[#D26E4B] hover:bg-[#F2E8E4] transition-all shadow-sm">
              <ArrowLeft size={18} />
            </div>
            <div>
               <span className="text-[11px] font-black text-[#1C1412] uppercase tracking-[0.2em] leading-none block italic">Jora Admin</span>
               <span className="text-[9px] font-bold text-[#8B8680] uppercase tracking-widest leading-none">Operational Hub</span>
            </div>
          </motion.div>

          {/* Center: Nav Pills */}
          <div className="flex bg-[#F5F0E8] p-1.5 rounded-2xl gap-1 overflow-x-auto hide-scrollbar border border-[#E8E2D9]/50 shadow-inner">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap relative ${
                    isActive
                      ? 'bg-[#1C1412] text-white shadow-xl shadow-black/20 italic'
                      : 'text-[#8B8680] hover:text-[#D26E4B] hover:bg-white/50'
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
                          isActive ? 'bg-[#D26E4B] text-white' : 'bg-[#D26E4B] text-white animate-pulse'
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
