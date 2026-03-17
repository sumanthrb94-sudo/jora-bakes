import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ShoppingBag } from 'lucide-react';

const CATEGORIES = ['All', 'Millet Brownies', 'Cheese Cakes', 'Burnt Basque', 'Cupcakes', 'Tiramisu'];

export const Shop = () => {
  const { products, loading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  
  const [selectedCategory, setSelectedCategory] = useState(
    categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { cartCount, cartTotal } = useCart();

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat.toLowerCase() === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat.toLowerCase() });
    }
  };

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter(p => (p?.category || '') === selectedCategory.toLowerCase().replace(' ', '_'));
  }, [selectedCategory, products]);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)]">
        <div className="text-[var(--color-terracotta)] font-script text-2xl animate-pulse">
          Baking your goodies...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm">
        <div className="px-4 py-4 flex justify-between items-center">
          <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Our Goodies</h1>
          <button className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
            <Filter size={20} />
          </button>
        </div>
        
        {/* Categories Bar */}
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-4 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[var(--color-chocolate)] text-[var(--color-cream)] shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard product={product} onQuickView={handleQuickView} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p>No goodies found in this category.</p>
          </div>
        )}
      </div>

      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
