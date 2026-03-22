import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  BarChart3, 
  LogOut,
  LayoutDashboard,
  ArrowLeft,
  Activity,
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

  useEffect(() => {
    const unsub = subscribeToCollection<Order>('orders', (data) => {
      const pending = data.filter(o => o.status === 'received').length;
      setPendingCount(pending);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Hub', path: '/admin' },
    { icon: <ShoppingBag size={18} />, label: 'Orders', path: '/admin/orders' },
    { icon: <Package size={18} />, label: 'Menu', path: '/admin/products' },
    { icon: <BarChart3 size={18} />, label: 'Stats', path: '/admin/analytics' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans max-w-[428px] mx-auto shadow-2xl relative overflow-hidden selection:bg-[var(--color-admin-dark)] selection:text-white">
      {/* Top Header - Pro Ops Logic */}
      <header className="bg-white border-b border-gray-100 flex flex-col sticky top-0 z-50 shrink-0">
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
                 <span className="text-[11px] font-black text-[var(--color-admin-dark)] uppercase tracking-tighter leading-none">Ops Pulse</span>
                 <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Live Sync</span>
                 </div>
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
                       px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                       ${isActive ? 'bg-white text-[var(--color-admin-dark)] shadow-sm' : 'text-gray-400'}
                     `}
                   >
                     {item.label}
                   </NavLink>
                 ))}
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCommandOpen(true)}
                className="w-8 h-8 bg-[#F2F4F7] rounded-xl flex items-center justify-center text-gray-400 border border-gray-100/50"
              >
                 <Command size={14} />
              </motion.button>
           </div>
        </div>
      </header>

      {/* Main Dynamic Workspace */}
      <main className="flex-1 overflow-y-auto bg-[#F8F9FA] p-4 pb-12">
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
