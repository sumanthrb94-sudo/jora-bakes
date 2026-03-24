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
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: cartCount },
    { icon: MapPin, label: 'Track', path: '/track' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <>

      <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-gray-100 px-4 py-3 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors relative ${
                  isActive ? 'text-[var(--color-terracotta)]' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    {item.badge !== undefined && item.badge > 0 && (
                      <div className="absolute -top-2 -right-2 bg-[var(--color-terracotta)] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                        {item.badge}
                      </div>
                    )}
                  </div>
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
