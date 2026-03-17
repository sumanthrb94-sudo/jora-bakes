import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, User, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';

export const BottomNav = () => {
  const { cartCount } = useCart();
  const location = useLocation();

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
                <div className="relative">
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label === 'Shop' && cartCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-2 bg-[var(--color-terracotta)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      {cartCount}
                    </motion.div>
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
