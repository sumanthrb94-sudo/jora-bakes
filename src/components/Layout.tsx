import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] bg-[#e5e5e5] flex justify-center selection:bg-[var(--color-terracotta)] selection:text-white">
      {/* Swiggy-style Mobile Device Container */}
      <div className="w-full max-w-[428px] bg-[#f7f5f0] min-h-[100dvh] relative shadow-2xl flex flex-col overflow-x-hidden">
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#3D2B1F',
              color: '#FFF8E7',
              borderRadius: '12px',
              fontSize: '14px',
              maxWidth: '400px'
            },
          }}
        />
        <main className="flex-1 w-full pb-20 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
      </div>
    </div>
  );
};
