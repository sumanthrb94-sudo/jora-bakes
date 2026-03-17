import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard = ({ product, onQuickView }: ProductCardProps) => {
  const { cart, addToCart, updateQuantity } = useCart();

  // Find if the default variant is in cart
  const defaultVariant = product.variants[0];
  const cartItem = cart.find(item => item.product.id === product.id && item.variant.id === defaultVariant.id);
  const quantity = cartItem?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.variants.length > 1) {
      onQuickView(product); // Open modal to select variant
    } else {
      addToCart(product, 1, defaultVariant);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) updateQuantity(cartItem.id, quantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cartItem) updateQuantity(cartItem.id, quantity - 1);
  };

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      onClick={() => onQuickView(product)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative cursor-pointer flex flex-col h-full transition-shadow duration-300"
    >
      {product.isEggless && (
        <div className="absolute top-3 left-3 z-10 bg-green-100/90 backdrop-blur-sm text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          100% Eggless
        </div>
      )}

      <div className="aspect-[16/10] overflow-hidden bg-gray-50 relative">
        <img 
          src={product.images[0]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Floating Quick Add Button (only shows when quantity is 0) */}
        <AnimatePresence>
          {quantity === 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAdd}
              className="absolute bottom-3 right-3 w-10 h-10 bg-[var(--color-terracotta)] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-opacity-90 z-20"
            >
              <Plus size={20} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="text-xs text-gray-500 mb-1">{product.weight}</div>
        <h3 className="font-semibold text-[var(--color-chocolate)] text-sm line-clamp-1 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-grow">{product.description}</p>
        
        <div className="flex items-center justify-between mt-auto h-8">
          <div className="font-bold text-[var(--color-chocolate)]">
            ₹{product.price}
          </div>
          
          <AnimatePresence mode="wait">
            {quantity > 0 && product.variants.length === 1 ? (
              <motion.div 
                key="stepper"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center bg-[var(--color-beige)] rounded-full px-1 py-1 shadow-inner"
              >
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDecrement}
                  className="w-7 h-7 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-full shadow-sm"
                >
                  <Minus size={14} />
                </motion.button>
                <span className="w-8 text-center text-sm font-bold text-[var(--color-chocolate)]">{quantity}</span>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={handleIncrement}
                  className="w-7 h-7 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-full shadow-sm"
                >
                  <Plus size={14} />
                </motion.button>
              </motion.div>
            ) : quantity > 0 && product.variants.length > 1 ? (
              <motion.button 
                key="options"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                className="bg-[var(--color-sage)] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
              >
                {quantity} in box
              </motion.button>
            ) : (
              <motion.div key="empty" className="w-8" /> /* Placeholder to keep layout stable */
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
