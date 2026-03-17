import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-20">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#3D2B1F',
            color: '#FFF8E7',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <main className="w-full">
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
  );
};
