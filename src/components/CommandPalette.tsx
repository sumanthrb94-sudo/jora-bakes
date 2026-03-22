import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Package, BarChart3, X, Command, ChefHat } from 'lucide-react';

interface CommandItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  shortcut?: string;
}

export const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const commands: CommandItem[] = [
    { icon: <ShoppingBag size={18} />, label: 'View Orders', path: '/admin/orders', shortcut: 'O' },
    { icon: <Package size={18} />, label: 'Manage Inventory', path: '/admin/products', shortcut: 'M' },
    { icon: <BarChart3 size={18} />, label: 'Operational Stats', path: '/admin/analytics', shortcut: 'S' },
    { icon: <ChefHat size={18} />, label: 'Kitchen Mode (KDS)', path: '/admin/kitchen', shortcut: 'K' },
  ];

  const filteredCommands = commands.filter(c => 
    c.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // Toggle handled via parent usually, but here we just ensure we can close too
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1C1C1C]/40 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -20 }}
          className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden relative z-[201]"
        >
           <div className="p-6 border-b border-gray-50 flex items-center gap-4">
              <Command size={20} className="text-gray-300" />
              <input 
                autoFocus
                type="text" 
                placeholder="Type a command or search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none text-base font-bold text-[#1C1C1C] focus:ring-0 outline-none placeholder:text-gray-200"
              />
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                 <span className="text-[10px] font-black text-gray-300">ESC</span>
              </div>
           </div>

           <div className="p-3">
              <div className="px-3 py-2">
                 <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1">Navigation Quick-Sync</p>
              </div>
              <div className="space-y-1">
                 {filteredCommands.length > 0 ? (
                    filteredCommands.map((command) => (
                      <button
                        key={command.path}
                        onClick={() => { navigate(command.path); onClose(); }}
                        className="w-full flex items-center justify-between p-4 rounded-3xl hover:bg-gray-50 transition-colors group"
                      >
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                               {command.icon}
                            </div>
                            <span className="text-sm font-black text-[#1C1C1C]">{command.label}</span>
                         </div>
                         {command.shortcut && (
                           <div className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 text-[10px] font-black text-gray-300">
                              {command.shortcut}
                           </div>
                         )}
                      </button>
                    ))
                 ) : (
                    <div className="p-8 text-center">
                       <p className="text-xs font-bold text-gray-300 tracking-tight">No commands found for "{search}"</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex justify-center">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Power Operations Mode Active</p>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
