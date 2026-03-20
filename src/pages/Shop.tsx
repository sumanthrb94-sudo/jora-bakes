import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Plus, Minus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingScreen } from '../components/LoadingScreen';

const CATEGORIES = ['All', 'Millet Brownies', 'Cheese Cakes', 'Burnt Basque', 'Cupcakes', 'Tiramisu'];

export const Shop = () => {
  const { products, loading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { cart, addToCart, updateQuantity } = useCart();

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat.toLowerCase() === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat.toLowerCase() });
    }
  };

  const categoriesToRender = useMemo(() => {
    return selectedCategory === 'All' 
      ? CATEGORIES.filter(c => c !== 'All') 
      : [selectedCategory];
  }, [selectedCategory]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Swiggy-style Cart Helpers for inline buttons
  const handleAdd = (product: Product) => {
    const outOfStock = product.stockQuantity !== undefined ? product.stockQuantity <= 0 : !product.isAvailable;
    if (outOfStock) return;
    if (product.variants && product.variants.length > 1) {
      handleQuickView(product); // Open modal to select variant
    } else if (product.variants && product.variants.length === 1) {
      addToCart(product, 1, product.variants[0]);
    }
  };

  const handleIncrement = (product: Product) => {
    const itemsInCart = cart.filter(item => item.product.id === product.id);
    const totalQuantity = itemsInCart.reduce((sum, item) => sum + item.quantity, 0);
    if (product.stockQuantity !== undefined && totalQuantity >= product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} available in stock.`);
      return;
    }
    if (itemsInCart.length > 1) {
      handleQuickView(product);
    } else if (itemsInCart.length === 1) {
      updateQuantity(itemsInCart[0].id, itemsInCart[0].quantity + 1);
    }
  };

  const handleDecrement = (product: Product) => {
    const itemsInCart = cart.filter(item => item.product.id === product.id);
    if (itemsInCart.length > 1) {
      handleQuickView(product);
    } else if (itemsInCart.length === 1) {
      updateQuantity(itemsInCart[0].id, itemsInCart[0].quantity - 1);
    }
  };

  if (loading) {
    return <LoadingScreen text="Baking your goodies..." />;
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] pb-32">
      {/* Swiggy Style Sticky Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm pt-safe">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)] hover:bg-gray-100 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-black text-lg text-[var(--color-chocolate)] tracking-tight leading-none">Jora Bakes Menu</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Artisanal Treats</p>
            </div>
          </div>
          <button className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)] hover:bg-gray-100 transition-colors">
            <Search size={20} />
          </button>
        </div>
        
        {/* Sticky Tab Filters */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3 pt-1 gap-2.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedCategory === cat
                  ? 'bg-white text-[var(--color-chocolate)] border-[var(--color-chocolate)] shadow-sm'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Swiggy Style Menu List */}
      <div className="pb-10">
        {categoriesToRender.map(category => {
          const categoryProducts = products.filter(p => (p?.category || '') === category.toLowerCase().replace(' ', '_'));
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category} className="mb-4 bg-white shadow-sm border-y border-gray-100">
              {/* Group Header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-black text-[var(--color-chocolate)] tracking-tight">
                  {category} ({categoryProducts.length})
                </h2>
              </div>

              {/* List Items */}
              <div>
                {categoryProducts.map((product, index) => {
                  const itemsInCart = cart.filter(item => item.product.id === product.id);
                  const totalQuantityInCart = itemsInCart.reduce((sum, item) => sum + item.quantity, 0);
                  const outOfStock = product.stockQuantity !== undefined ? product.stockQuantity <= 0 : !product.isAvailable;
                  const isLast = index === categoryProducts.length - 1;

                  return (
                    <div 
                      key={product.id} 
                      className={`p-5 flex gap-4 cursor-pointer active:bg-gray-50 transition-colors ${!isLast ? 'border-b border-dashed border-gray-200' : ''}`}
                      onClick={() => handleQuickView(product)}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        {product.isEggless && (
                          <div className="w-4 h-4 border-[1.5px] border-green-600 rounded flex items-center justify-center mb-1.5">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                          </div>
                        )}
                        <h3 className="font-bold text-[var(--color-chocolate)] text-base mb-1">{product.name}</h3>
                        <p className="font-black text-gray-800 text-sm mb-2 tracking-tight">₹{product.price}</p>
                        
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 mb-2">
                          <Star size={12} className="text-[var(--color-gold)] fill-[var(--color-gold)]" /> 
                          4.8 <span className="mx-1">•</span> Fresh Daily
                        </div>
                        
                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
                      </div>

                      {/* Right Side Image & Add Button */}
                      <div className="relative w-[130px] shrink-0 flex flex-col items-center">
                        <div className="w-[130px] h-[130px] rounded-2xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        
                        {/* Floating Action Button */}
                        <div className="absolute -bottom-3 w-[100px] z-10" onClick={e => e.stopPropagation()}>
                          {outOfStock ? (
                            <button disabled className="w-full bg-white text-gray-400 border border-gray-200 py-2 rounded-xl font-black text-[10px] shadow-sm cursor-not-allowed uppercase tracking-wider">
                              Sold Out
                            </button>
                          ) : totalQuantityInCart === 0 ? (
                            <button
                              onClick={() => handleAdd(product)}
                              className="w-full bg-white text-[var(--color-terracotta)] border border-gray-200 py-2 rounded-xl font-black text-xs shadow-md hover:bg-gray-50 transition-colors uppercase tracking-wider relative overflow-hidden"
                            >
                              ADD
                              <div className="absolute top-0 right-0 w-4 h-4 bg-orange-50 rounded-bl-lg flex items-center justify-center">
                                <Plus size={10} className="text-[var(--color-terracotta)]" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-full bg-white text-[var(--color-terracotta)] border border-gray-200 flex items-center justify-between h-[36px] rounded-xl shadow-md overflow-hidden">
                              <button onClick={() => handleDecrement(product)} className="w-8 h-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <Minus size={16} strokeWidth={3} />
                              </button>
                              <span className="font-black text-xs">{totalQuantityInCart}</span>
                              <button onClick={() => handleIncrement(product)} className="w-8 h-full flex items-center justify-center hover:bg-gray-50 transition-colors">
                                <Plus size={16} strokeWidth={3} />
                              </button>
                            </div>
                          )}
                          {product.variants && product.variants.length > 1 && totalQuantityInCart === 0 && (
                            <p className="text-[9px] text-gray-400 font-bold text-center mt-1 w-full absolute -bottom-4 tracking-wider">Customizable</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
