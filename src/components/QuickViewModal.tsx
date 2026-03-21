import React, { useState } from 'react';
import { Product, Variant, SelectedCustomization } from '../types';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Info, Share2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal = ({ product, isOpen, onClose }: QuickViewModalProps) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Variant | undefined>(undefined);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [specialRequests, setSpecialRequests] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  React.useEffect(() => {
    if (product) {
      setQuantity(1);
      setSelectedVariant(product.variants?.[0]);
      setSpecialRequests('');
      setSelectedOptions({}); // Force user to manually pick to avoid mistakes
      setShowValidation(false);
    }
  }, [product, cart]);

  if (!product) return null;

  // Compute dynamic price from variants and add-ons
  let addonsPrice = 0;
  product.customizationGroups?.forEach(g => {
    const selected = selectedOptions[g.id] || [];
    g.options.forEach(o => { if (selected.includes(o.id)) addonsPrice += o.priceModifier; });
  });
  const currentPrice = (selectedVariant ? product.price + selectedVariant.priceModifier : product.price) + addonsPrice;

  // Find the specific item in the cart that matches the current selection
  const mappedCustomizations: SelectedCustomization[] = [];
  product.customizationGroups?.forEach(g => {
    const selected = selectedOptions[g.id] || [];
    g.options.forEach(o => {
      if (selected.includes(o.id)) mappedCustomizations.push({ groupName: g.name, optionName: o.name, price: o.priceModifier });
    });
  });

  const cartItem = cart.find(item => 
    item.product.id === product.id && 
    item.variant.id === selectedVariant?.id &&
    (item.specialRequest || '') === (specialRequests || '') &&
    JSON.stringify(item.customizations || []) === JSON.stringify(mappedCustomizations)
  );
  const quantityInCart = cartItem?.quantity || 0;

  const outOfStock = product.stockQuantity !== undefined ? product.stockQuantity <= 0 : !product.isAvailable;
  const maxQuantity = product.stockQuantity !== undefined ? product.stockQuantity : 99;
  const totalQuantityInCart = cart.filter(item => item.product.id === product.id).reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = () => {
    if (outOfStock) return;
    
    // Validate Required Customizations
    const missingRequired = product.customizationGroups?.find(
      g => g.required && (!selectedOptions[g.id] || selectedOptions[g.id].length === 0)
    );
    if (missingRequired) {
      setShowValidation(true);
      toast.error(`Please select an option for ${missingRequired.name}`);
      return;
    }

    if (totalQuantityInCart + quantity > maxQuantity) {
      toast.error(`Only ${maxQuantity} available in stock.`);
      return;
    }
    if (selectedVariant) {
      addToCart(product, quantity, selectedVariant, specialRequests, mappedCustomizations);
    }
  };

  const handleIncrement = () => {
    if (totalQuantityInCart >= maxQuantity) {
      toast.error(`Only ${maxQuantity} available in stock.`);
      return;
    }
    if (cartItem) updateQuantity(cartItem.id, cartItem.quantity + 1);
  };

  const handleDecrement = () => {
    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      updateQuantity(cartItem.id, newQuantity);
      if (newQuantity <= 0) onClose();
    }
  };

  const toggleOption = (groupId: string, optionId: string, selectionType: 'single' | 'multiple') => {
    setShowValidation(false); // Clear errors when they make a choice
    setSelectedOptions(prev => {
      const current = prev[groupId] || [];
      if (selectionType === 'single') {
        return { ...prev, [groupId]: [optionId] };
      } else {
        if (current.includes(optionId)) return { ...prev, [groupId]: current.filter(id => id !== optionId) };
        return { ...prev, [groupId]: [...current, optionId] };
      }
    });
  };

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
              <h3 className="font-script text-2xl text-[var(--color-terracotta)]">Jora Bakes</h3>
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
                  src={product.images?.length > 1 ? product.images[1] : (product.images?.[0] || 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?auto=format&fit=crop&q=80&w=800')} 
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

              {product.variants && product.variants.length > 1 && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-[var(--color-chocolate)] mb-3">Select Size</h4>
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
                        {variant.weight} {variant.priceModifier > 0 && `(+₹${variant.priceModifier})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.customizationGroups?.map((group) => {
                const hasError = showValidation && group.required && (!selectedOptions[group.id] || selectedOptions[group.id].length === 0);
                return (
                <div key={group.id} className={`mb-6 p-4 -mx-4 sm:mx-0 sm:rounded-2xl transition-colors duration-300 ${hasError ? 'bg-red-50 border-y sm:border border-red-200' : 'bg-transparent border-none'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className={`text-sm font-bold ${hasError ? 'text-red-600' : 'text-[var(--color-chocolate)]'}`}>{group.name}</h4>
                    {group.required && <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${hasError ? 'bg-red-100 text-red-600' : 'bg-orange-50 text-[var(--color-terracotta)]'}`}>Required</span>}
                  </div>
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const isSelected = (selectedOptions[group.id] || []).includes(option.id);
                      return (
                        <label 
                          key={option.id} 
                          onClick={() => toggleOption(group.id, option.id, group.selectionType)}
                          className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${isSelected ? 'border-[var(--color-terracotta)] bg-orange-50/30' : 'border-gray-100 bg-white hover:bg-gray-50 shadow-sm'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded${group.selectionType === 'single' ? '-full' : ''} border-2 flex items-center justify-center ${isSelected ? 'border-[var(--color-terracotta)] bg-[var(--color-terracotta)]' : 'border-gray-300'}`}>
                               {isSelected && <div className={`bg-white ${group.selectionType === 'single' ? 'w-2 h-2 rounded-full' : 'w-2.5 h-2.5 rounded-sm'}`} />}
                            </div>
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              {option.name}
                              {option.isBestSeller && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-orange-100 text-[var(--color-terracotta)] px-1.5 py-0.5 rounded-sm">Bestseller</span>
                              )}
                            </span>
                          </div>
                          {option.priceModifier > 0 && <span className="text-sm font-semibold text-gray-600">+₹{option.priceModifier}</span>}
                        </label>
                      )
                    })}
                  </div>
                </div>
                );
              })}

              <div className="bg-[var(--color-beige)] rounded-2xl p-4 mb-6 space-y-3">
                {product.bakeTime && (
                  <div className="flex items-start gap-3 pb-3 border-b border-gray-200/50">
                    <Clock size={18} className="text-[var(--color-terracotta)] mt-0.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Preparation Time</h5>
                      <p className="text-sm font-bold text-[var(--color-terracotta)]">{product.bakeTime}</p>
                    </div>
                  </div>
                )}
                
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

              {outOfStock ? (
                <div className="mt-4 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-lg flex items-center justify-center border border-gray-200">
                  Currently Out of Stock
                </div>
              ) : quantityInCart === 0 ? (
                // State 1: Item not in cart
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center bg-gray-100 rounded-2xl px-2 py-2">
                    <button onClick={() => quantity <= 1 ? onClose() : setQuantity(quantity - 1)} className="w-10 h-10 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-xl shadow-sm">
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                    <button onClick={() => quantity < maxQuantity ? setQuantity(quantity + 1) : toast.error(`Only ${maxQuantity} available.`)} className="w-10 h-10 flex items-center justify-center text-[var(--color-chocolate)] bg-white rounded-xl shadow-sm">
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
