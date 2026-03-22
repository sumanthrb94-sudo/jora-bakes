import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

export const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full"
      >
        <div className="w-20 h-20 bg-[#D26E4B] rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-[#D26E4B]/20">
          <Clock size={40} />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-[#1C1412] font-display mb-4 italic">
          Coming Soon.
        </h1>
        
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D26E4B] mb-8">
          The New Admin Hub is Under Construction
        </p>
        
        <div className="h-px bg-gradient-to-r from-transparent via-[#E8E2D9] to-transparent mb-8" />
        
        <p className="text-sm font-bold text-[#8B8680] leading-relaxed">
          We are building a powerful, logistics-grade command center for Jora Bakes. Stay tuned for real-time tracking and SKU management.
        </p>
      </motion.div>
    </div>
  );
};