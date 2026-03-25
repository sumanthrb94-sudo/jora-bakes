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
        {/* Animated Cupcakes */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
              className="relative w-16 h-16"
            >
              {/* Cupcake SVG */}
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
                {/* Wrapper/Cup */}
                <path 
                  d="M20,60 L80,60 L70,90 L30,90 Z" 
                  fill="#D26E4B" 
                  className="drop-shadow-sm"
                />
                <path 
                  d="M20,60 L80,60 L78,65 L22,65 Z" 
                  fill="#B85A3A" 
                />
                {/* Cake/Frosting */}
                <path 
                  d="M15,60 C15,30 35,20 50,20 C65,20 85,30 85,60" 
                  fill="#FFF7ED" 
                />
                <circle cx="50" cy="20" r="5" fill="#EF4444" /> {/* Cherry */}
                {/* Details */}
                <rect x="35" y="40" width="30" height="4" rx="2" fill="#FED7AA" opacity="0.5" />
                <rect x="40" y="50" width="20" height="3" rx="1.5" fill="#FED7AA" opacity="0.5" />
              </svg>
            </motion.div>
          ))}
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