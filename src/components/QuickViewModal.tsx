import React, { useState } from 'react';
import { Product, Variant } from '../types';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Info, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal = ({ product, isOpen, onClose }: QuickViewModalProps) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(undefined);
  const [specialRequests, setSpecialRequests] = useState('');

  React.useEffect(() => {
    if (product && product.variants.length > 0) {
      setQuantity(1);
      // If there's already an item in the cart for this product, pre-select its variant
      const existingItem = cart.find(item => item.product.id === product.id);
      setSelectedVariant(existingItem ? existingItem.variant : product.variants[0]);
      setSpecialRequests('');
    }
  }, [product, cart]);

  if (!product) return null;

  // Find the specific item in the cart that matches the current selection
  const cartItem = cart.find(item => 
    item.product.id === product.id && 
    item.variant.id === selectedVariant?.id &&
    (item.specialRequest || '') === (specialRequests || '')
  );
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    if (selectedVariant) {
      addToCart(product, quantity, selectedVariant, specialRequests);
    }
  };

  const handleIncrement = () => {
    if (cartItem) updateQuantity(cartItem.id, cartItem.quantity + 1);
  };

  const handleDecrement = () => {
    if (cartItem) updateQuantity(cartItem.id, cartItem.quantity - 1);
  };


  const currentPrice = selectedVariant ? product.price + selectedVariant.priceModifier : product.price;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto hide-scrollbar pb-safe"
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-3 flex justify-between items-center border-b border-gray-100">
              <h3 className="font-script text-2xl text-[var(--color-terracotta)]">Zora Bakes</h3>
              <div className="flex gap-2">
                <button className="p-2 bg-gray-100 rounded-full text-gray-600">
                  <Share2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative">
                <img 
                  src={product.images[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                /> 
                {product.isEggless && (
                  <div className="absolute top-3 left-3 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    100% Eggless
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-[var(--color-chocolate)] pr-4">{product.name}</h2>
                  <div className="text-xl font-bold text-[var(--color-terracotta)] whitespace-nowrap">
                    ₹{currentPrice}
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {product.variants.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold mb-3">Select Size/Variant</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                          selectedVariant?.id === variant.id
                            ? 'bg-[var(--color-terracotta)] text-white border-[var(--color-terracotta)]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--color-terracotta)]'
                        }`}
                      >
                        {variant.weight} - {variant.flavor}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-[var(--color-beige)] rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-[var(--color-sage)] mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Ingredients</h5>
                    <p className="text-sm text-gray-600">{product.ingredients.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Info size={18} className="text-[var(--color-sage)] mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Storage & Shelf Life</h5>
                    <p className="text-sm text-gray-600">{product.storage} Best before {product.shelfLife}.</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-2">Special Requests?</h4>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="E.g., Write 'Happy Birthday' on top..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] focus:border-transparent resize-none h-20"
                />
              </div>

              {quantityInCart === 0 ? (
                // State 1: Item not in cart
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center bg-gray-100 rounded-2xl px-2 py-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-xl shadow-sm">
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-xl shadow-sm">
                      <Plus size={18} />
                    </button>
                  </div>
                  <button onClick={handleAddToCart} className="flex-1 bg-[var(--color-chocolate)] text-[var(--color-cream)] py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                    Add to Box • ₹{currentPrice * quantity}
                  </button>
                </div>
              ) : (
                // State 2: Item is in cart
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="flex items-center bg-gray-100 rounded-2xl px-2 py-2">
                    <button onClick={handleDecrement} className="w-10 h-10 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-xl shadow-sm">
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center text-lg font-semibold">{quantityInCart}</span>
                    <button onClick={handleIncrement} className="w-10 h-10 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-xl shadow-sm">
                      <Plus size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={onClose}
                    className="flex-1 bg-[var(--color-terracotta)] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
