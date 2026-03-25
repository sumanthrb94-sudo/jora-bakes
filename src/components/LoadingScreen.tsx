import React from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[99999] bg-[#f7f5f0] flex flex-col items-center justify-center p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8"
      >
        {/* Animated Premium Icons */}
        <div className="flex gap-8 mb-8 items-center justify-center">
          {/* Logo 1: Brownie */}
          <motion.div
            animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
              <rect x="20" y="20" width="60" height="60" rx="4" fill="#3D2B1F" />
              <rect x="25" y="25" width="50" height="50" rx="2" fill="#4A3426" />
              <circle cx="35" cy="35" r="3" fill="#2D1F16" />
              <circle cx="65" cy="45" r="3" fill="#2D1F16" />
              <circle cx="45" cy="65" r="3" fill="#2D1F16" />
            </svg>
            <p className="text-[7px] font-black uppercase text-[#3D2B1F]/40 tracking-widest mt-2 leading-tight">Brownie</p>
          </motion.div>

          {/* Logo 2: Cake */}
          <motion.div
            animate={{ y: [0, -25, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
            className="w-20 h-20 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
              {/* Bottom Layer */}
              <path d="M20,70 L80,70 L75,90 L25,90 Z" fill="#D26E4B" />
              {/* Top Layer */}
              <path d="M25,45 L75,45 L72,70 L28,70 Z" fill="#B85A3A" />
              {/* Frosting */}
              <path d="M25,45 Q50,35 75,45 L75,55 Q50,65 25,55 Z" fill="#FFF7ED" />
              {/* Candle */}
              <rect x="47.5" y="20" width="5" height="15" fill="#D4AF37" />
              <path d="M50,12 Q53,16 50,20 Q47,16 50,12" fill="#EF4444" />
            </svg>
            <p className="text-[7px] font-black uppercase text-[#D26E4B]/60 tracking-widest mt-1 leading-tight">Cakes</p>
          </motion.div>

          {/* Logo 3: Cookie */}
          <motion.div
            animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: "easeInOut" }}
            className="w-16 h-16 pointer-events-none"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
              <circle cx="50" cy="50" r="40" fill="#E8B07E" />
              <circle cx="35" cy="35" r="6" fill="#4A3426" />
              <circle cx="65" cy="40" r="5" fill="#4A3426" />
              <circle cx="45" cy="65" r="7" fill="#4A3426" />
              <circle cx="60" cy="70" r="4" fill="#4A3426" />
            </svg>
            <p className="text-[7px] font-black uppercase text-[#E8B07E] tracking-widest mt-2 leading-tight">Cookies</p>
          </motion.div>
        </div>

        {/* Brand Text */}
        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black text-[#3D2B1F] tracking-tighter italic uppercase"
          >
            Jora Bakes
          </motion.h1>
          
          <div className="flex flex-col items-center gap-2">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[10px] font-black text-[#D26E4B] uppercase tracking-[0.4em] italic leading-tight"
            >
              Curating your experience
            </motion.p>
            
            <div className="w-32 h-[2px] bg-gray-200 rounded-full overflow-hidden mt-4">
              <motion.div
                animate={{
                  x: [-128, 128]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-full h-full bg-gradient-to-r from-transparent via-[#D26E4B] to-transparent"
              />
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex items-center gap-2 text-[#8B8680] font-black text-[9px] uppercase tracking-[0.2em]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#D26E4B] animate-pulse" />
        Loading Fresh Batches
      </motion.div>
    </div>
  );
};