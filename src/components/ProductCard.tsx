import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { Plus, Minus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { cart, addToCart, updateQuantity } = useCart();

  // Find all items in the cart that match this product, regardless of variant
  const itemsInCart = cart.filter(item => item.product.id === product.id);
  const totalQuantityInCart = itemsInCart.reduce((sum, item) => sum + item.quantity, 0);

  // Get a reference to the specific cart item to handle exact increment/decrement natively
  const cartItem = itemsInCart.length === 1 ? itemsInCart[0] : null;

  const outOfStock = product.stockQuantity !== undefined ? product.stockQuantity <= 0 : !product.isAvailable;
  const hasCustomizations = product.customizationGroups && product.customizationGroups.length > 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    if (hasCustomizations || (product?.variants && product.variants.length > 1)) {
      onQuickView(product); // Force modal open to pick flavors
    } else if (product?.variants && product.variants.length === 1) {
      addToCart(product, 1, product.variants[0]);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQuantity !== undefined && totalQuantityInCart >= product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} available in stock.`);
      return;
    }
    if (hasCustomizations || (product.variants && product.variants.length > 1) || itemsInCart.length > 1 || !cartItem) {
      onQuickView(product); // Intercept incrementor and open modal so they can choose their specific flavor
    } else {
      updateQuantity(cartItem.id, cartItem.quantity + 1);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemsInCart.length > 1 || !cartItem) {
      onQuickView(product);
    } else {
      updateQuantity(cartItem.id, cartItem.quantity - 1);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      onClick={() => onQuickView(product)}
      className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 relative cursor-pointer flex flex-col h-full transition-all duration-300"
    >
      <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 relative mb-3">
        <img 
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=800'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="px-2 pb-3 flex flex-col flex-grow text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          {/* Pure Veg Indicator */}
          {product.isEggless && (
            <div className="w-3.5 h-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
            </div>
          )}
          {(hasCustomizations || product?.variants?.length > 1) && (
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-1.5 py-0.5 rounded">Customizable</span>
          )}
        </div>
        
        <h3 className="font-bold text-[var(--color-chocolate)] text-sm line-clamp-1 mb-1">{product.name}</h3>
        
        {product.bakeTime && (
          <div className="flex items-center justify-center gap-1 text-[9px] font-black text-[var(--color-terracotta)] uppercase tracking-wider mb-1.5 bg-orange-50 self-center px-2 py-0.5 rounded-full w-fit mx-auto">
            <Clock size={10} strokeWidth={3} /> {product.bakeTime}
          </div>
        )}
        
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed flex-grow">{product.description}</p>
        <div className="font-bold text-gray-700 text-sm mt-1.5 mb-3">₹{product.price}</div>
        
        {/* Functional Zomato-style Add Button */}
        <div 
          className="mx-auto"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {outOfStock ? (
            <button
              disabled
              className="bg-gray-100 text-gray-400 border border-gray-200 px-6 py-2 rounded-xl font-black text-xs shadow-sm cursor-not-allowed whitespace-nowrap"
            >
              OUT OF STOCK
            </button>
          ) : totalQuantityInCart === 0 ? (
            <button
              onClick={handleAdd}
              className="bg-white text-[var(--color-terracotta)] border border-gray-200 px-8 py-2 rounded-xl font-black text-sm hover:border-[var(--color-terracotta)] transition-colors shadow-sm"
            >
              ADD
            </button>
          ) : (
            <div className="bg-[var(--color-terracotta)] text-white flex items-center justify-between min-w-[100px] h-[38px] rounded-xl shadow-sm overflow-hidden">
              <button 
                onClick={handleDecrement}
                className="w-8 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
              >
                <Minus size={16} strokeWidth={3} />
              </button>
              <span className="font-bold text-sm px-1">{totalQuantityInCart}</span>
              <button 
                onClick={handleIncrement}
                className="w-8 h-full flex items-center justify-center hover:bg-black/10 transition-colors"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
