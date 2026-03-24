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

  const outOfStock = !product.isAvailable || (product.stockQuantity !== undefined && product.stockQuantity <= 0);
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
    if (outOfStock) return;
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
      whileHover={!outOfStock ? { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
      onClick={() => onQuickView(product)}
      className={`bg-white rounded-[2rem] p-2 shadow-sm border border-gray-100 relative cursor-pointer flex flex-col h-full transition-all duration-300 ${outOfStock ? 'opacity-70 grayscale-[0.8]' : ''}`}
    >
      <div className="aspect-square rounded-[1.5rem] overflow-hidden bg-gray-50 relative mb-3">
        <img 
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=800'} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex gap-1 items-center">
           {product.isEggless && (
             <div className="w-3.5 h-3.5 border border-[#00B189] rounded-sm flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 bg-[#00B189] rounded-full" />
             </div>
           )}
           {(product.discountPercentage || 0) > 0 && (
             <span className="bg-[#FF4B4B] text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">-{product.discountPercentage}%</span>
           )}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center p-4">
             <span className="bg-white/95 backdrop-blur-sm text-[#FF4B4B] text-[10px] font-black uppercase tracking-[0.2em] px-3 py-2 rounded-xl shadow-xl border border-red-100 text-center leading-tight">
               Preparing<br/>next batch
             </span>
          </div>
        )}
      </div>

      <div className="px-2 pb-3 flex flex-col flex-grow">
        <h3 className="font-black text-[#1C1C1C] text-sm line-clamp-2 mb-0.5 uppercase tracking-tight">{product.name}</h3>
        <p className="text-[10px] text-gray-400 font-bold mb-2 uppercase tracking-wider">{product.category.replace('_', ' ')}</p>
        
        <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed flex-grow font-medium">{product.description}</p>
        
        <div className="flex items-center justify-between mt-3 mb-3">
          <div className="flex flex-col">
             {product.mrp && product.mrp > product.price && (
               <span className="text-[10px] text-gray-300 font-black line-through leading-none mb-0.5">Rs. {product.mrp}</span>
             )}
             <span className="text-base font-black text-[#1C1C1C] leading-none">Rs. {product.price}</span>
          </div>
          
          <div 
            className="shrink-0"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {outOfStock ? (
              <div className="bg-[#fdf2f2] text-[#FF4B4B] px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-red-100 shadow-sm text-center leading-none max-w-[120px]">
                 <div className="w-1.5 h-1.5 bg-[#FF4B4B] rounded-full shrink-0 animate-pulse" />
                 preparing next batch
              </div>
            ) : totalQuantityInCart === 0 ? (
              <button
                onClick={handleAdd}
                className="bg-white text-[#1C1C1C] border border-gray-200 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-[#1C1C1C] transition-all active:scale-95"
              >
                ADD
              </button>
            ) : (
              <div className={`flex items-center justify-between min-w-[80px] h-[32px] rounded-xl shadow-lg border border-white/10 ${outOfStock ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-[#1C1C1C] text-white'}`}>
                <button onClick={!outOfStock ? handleDecrement : undefined} className={`w-7 h-full flex items-center justify-center ${!outOfStock ? 'hover:bg-white/10' : ''}`}><Minus size={14} strokeWidth={3} /></button>
                <span className="font-black text-xs">{totalQuantityInCart}</span>
                <button onClick={!outOfStock ? handleIncrement : undefined} className={`w-7 h-full flex items-center justify-center ${!outOfStock ? 'hover:bg-white/10' : ''}`}><Plus size={14} strokeWidth={3} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
