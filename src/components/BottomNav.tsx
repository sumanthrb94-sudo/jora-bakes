import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, User, MapPin, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

export const BottomNav = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide bottom nav on checkout page
  if (location.pathname === '/checkout') {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: MapPin, label: 'Track', path: '/track' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <>
      {/* Floating Cart Button (Bottom Right) */}
      <AnimatePresence>
        {cartCount > 0 && location.pathname !== '/cart' && (
          <div className="fixed bottom-[88px] left-0 right-0 max-w-[428px] mx-auto z-50 pointer-events-none flex justify-end px-6">
            <motion.button
              onClick={() => navigate('/cart')}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="pointer-events-auto relative bg-[var(--color-chocolate)] text-[var(--color-cream)] w-16 h-16 rounded-full shadow-xl shadow-black/20 flex items-center justify-center border-4 border-white"
            >
              <ShoppingCart size={24} />
              <motion.div
                key={cartCount} // Animate a subtle pop when count changes
                initial={{ scale: 0.5, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="absolute -top-2 -right-2 bg-[var(--color-terracotta)] text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
              >
                {cartCount}
              </motion.div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-gray-100 px-6 py-3 z-40 pb-safe">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-[var(--color-terracotta)]' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};
