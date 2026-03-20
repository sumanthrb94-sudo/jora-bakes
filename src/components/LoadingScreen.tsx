import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  text?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ text = "Warming up the ovens..." }) => {
  return (
    <div className="flex-1 min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#f7f5f0] absolute inset-0 z-[100]">
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative mb-6"
      >
        {/* Floating Swiggy-Style Icon Wrapper */}
        <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-orange-50 relative z-10">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Frosting */}
            <path d="M12 3C9.5 3 8 5 8 5C6 5 5 7 5 9C5 11 6.5 12 6.5 12H17.5C17.5 12 19 11 19 9C19 7 18 5 16 5C16 5 14.5 3 12 3Z" fill="var(--color-terracotta)"/>
            {/* Base */}
            <path d="M7 13L8.5 21H15.5L17 13H7Z" fill="#8B5A2B"/>
            {/* Sprinkles */}
            <circle cx="10" cy="7" r="1" fill="white"/>
            <circle cx="14" cy="6" r="1" fill="#FFD700"/>
            <circle cx="13" cy="9" r="1" fill="white"/>
            <circle cx="9" cy="10" r="1" fill="#FFD700"/>
            {/* Cherry */}
            <circle cx="12" cy="3" r="2.5" fill="#EF4444"/>
            <path d="M12 1C13 1 14 2 14 2" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        
        {/* Animated Steam/Aroma */}
        <motion.div animate={{ opacity: [0, 1, 0], y: [0, -15] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }} className="absolute -top-4 left-6 w-1.5 h-6 bg-[var(--color-terracotta)]/20 rounded-full blur-[1px]" />
        <motion.div animate={{ opacity: [0, 1, 0], y: [0, -20] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} className="absolute -top-8 left-12 w-2 h-8 bg-[var(--color-terracotta)]/20 rounded-full blur-[1px]" />
        <motion.div animate={{ opacity: [0, 1, 0], y: [0, -15] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }} className="absolute -top-2 right-6 w-1.5 h-6 bg-[var(--color-terracotta)]/20 rounded-full blur-[1px]" />
      </motion.div>
      
      <motion.h1 
        animate={{ scale: [0.98, 1, 0.98] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="font-script text-4xl text-[var(--color-chocolate)] tracking-tight mb-2"
      >
        Jora Bakes
      </motion.h1>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
        {text}
      </p>
    </div>
  );
};