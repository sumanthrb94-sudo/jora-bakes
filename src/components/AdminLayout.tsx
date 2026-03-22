import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  Command
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToCollection } from '../services/firestore';
import { Order } from '../types';
import { CommandPalette } from './CommandPalette';

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

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

  // Removed pendingCount logic

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems: any[] = [];

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-sans relative overflow-x-hidden selection:bg-[#1D1D1F] selection:text-white">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-black/5 sticky top-0 z-50 shrink-0">
        <div className="h-14 flex items-center justify-between px-5">
           <motion.div 
             whileTap={{ scale: 0.95 }}
             className="flex items-center gap-2 cursor-pointer" 
             onClick={() => navigate('/')}
           >
              <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                <ArrowLeft size={16} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest leading-none">Jora Admin</span>
              </div>
           </motion.div>
           
           <div className="flex items-center gap-4">
              {pendingCount > 0 && (
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black animate-bounce shadow-lg shadow-red-500/20"
                >
                  {pendingCount} NEW
                </motion.div>
              )}
              <div className="flex bg-[#F2F4F7] p-1 rounded-xl">
                 {navItems.map((item) => (
                   <NavLink
                     key={item.path}
                     to={item.path}
                     end={item.path === '/admin'}
                     className={({ isActive }) => `
                       px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                       ${isActive ? 'bg-[#1D1D1F] text-white shadow-xl shadow-black/10' : 'text-gray-400 hover:text-[#1D1D1F]'}
                     `}
                   >
                     {item.label}
                   </NavLink>
                 ))}
              </div>
              {/* Removed Command Button */}
           </div>
        </div>
      </header>

      {/* Main Dynamic Workspace */}
      <main className="flex-1 overflow-y-auto bg-[#F5F5F7] pb-12">
        <motion.div
           key={window.location.pathname}
           initial={{ opacity: 0, y: 5 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.15 }}
        >
           <Outlet />
        </motion.div>
      </main>

      <CommandPalette 
        isOpen={isCommandOpen} 
        onClose={() => setIsCommandOpen(false)} 
      />
    </div>
  );
};
