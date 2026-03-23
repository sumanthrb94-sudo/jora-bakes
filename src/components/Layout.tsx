import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';

export const Layout = () => {
  const location = useLocation();

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#e5e5e5] flex justify-center selection:bg-[var(--color-terracotta)] selection:text-white">
      {/* Swiggy-style Mobile Device Container */}
      <div className="w-full max-w-[428px] bg-[#f7f5f0] h-full relative shadow-2xl flex flex-col overflow-hidden">
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
        <main id="main-scroll-container" className="flex-1 w-full pb-20 relative flex flex-col overflow-y-auto overflow-x-hidden overscroll-y-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex-1 w-full flex flex-col relative"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomNav />
        <div id="modal-root" className="absolute inset-0 z-[99999] pointer-events-none empty:hidden" />
      </div>
    </div>
  );
};
