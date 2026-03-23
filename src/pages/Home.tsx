import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { Product } from '../types';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, Search, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthView } from '../components/AuthView';

export const Home = () => {
  const { products, loading } = useProducts();
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Filter products for different sections
  // Filter available products
  const availableProducts = products.filter(p => (p.stockQuantity ?? 0) > 0 && p.isAvailable);
  const bestSellers = availableProducts.slice(0, 4); 
  const trending = availableProducts.slice(2, 6);

  return (
    <div className="bg-[#f7f5f0] min-h-screen pb-24">
      {/* Swiggy Style Sticky App Bar */}
      <div className="bg-white sticky top-0 z-30 pt-safe shadow-sm rounded-b-[24px] mb-4">
        <div className="px-4 pt-4 pb-4">
          <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => navigate('/addresses')} 
              className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center text-[var(--color-terracotta)] shrink-0 shadow-sm border border-orange-100">
                <MapPin size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 font-black text-[var(--color-chocolate)] text-sm">
                  {profile?.addresses?.[0]?.label || 'Delivering to'} <ChevronDown size={14} className="text-[var(--color-terracotta)]" />
                </div>
                <p className="text-[11px] text-gray-500 truncate font-medium mt-0.5">
                  {profile?.addresses?.[0]?.street || 'Tap to add delivery address'}
                </p>
              </div>
            </button>
            <Link to="/profile" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm shrink-0">
              <img 
                src={profile?.photoURL || user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.displayName || 'Guest')}&background=ea580c&color=fff`} 
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </Link>
          </div>
          
          {/* Global Search Bar */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search for brownies, cakes, or cookies..." 
              onClick={() => { /* Navigation to a dedicated search page could go here */ }}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-medium text-[var(--color-chocolate)] focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] shadow-inner transition-all placeholder:text-gray-400" 
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-terracotta)]" size={18} strokeWidth={2.5} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 border-l border-gray-200 pl-3">
              <Sparkles size={16} className="text-[var(--color-gold)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Offers Banner */}
      {products.find(p => p.id === 'p5') && (products.find(p => p.id === 'p5')?.stockQuantity ?? 0) > 0 && products.find(p => p.id === 'p5')?.isAvailable && (
        <div className="px-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-[var(--color-terracotta)] to-orange-500 rounded-[24px] p-5 text-white relative overflow-hidden shadow-lg shadow-orange-500/20"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-black/10 rounded-tl-full" />
            
            <div className="relative z-10 w-2/3">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full mb-2 inline-block backdrop-blur-sm shadow-sm border border-white/10">
                Deal of the Day
              </span>
              <h2 className="text-xl font-black mb-1 leading-tight tracking-tight">Try our Signature Tiramisu</h2>
              <p className="text-xs text-white/90 mb-4 font-medium">Espresso and velvety mascarpone.</p>
              <button 
                onClick={() => {
                  const p = products.find(p => p.id === 'p5');
                  if (p) handleQuickView(p);
                }}
                className="bg-white text-[var(--color-terracotta)] text-xs font-black px-5 py-2.5 rounded-full shadow-sm hover:scale-105 transition-transform active:scale-95"
              >
                Order Now
              </button>
            </div>
          </motion.div>
        </div>
      )}


      {/* Trending / Recommended (Horizontal Scroll) */}
      <section className="mb-8">
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className="text-lg font-black text-[var(--color-chocolate)] tracking-tight">Recommended for you</h2>
          <Link to="/shop" className="text-xs font-bold text-[var(--color-terracotta)] flex items-center">
            See all <ChevronRight size={14} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 pb-4 snap-x">
          {bestSellers.map((product) => (
            <div key={product.id} className="snap-start shrink-0 w-[170px]">
              <ProductCard product={product} onQuickView={handleQuickView} />
            </div>
          ))}
        </div>
      </section>

      {/* All Products Grid */}
      <section className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[var(--color-chocolate)] tracking-tight">Top Picks from Menu</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {availableProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
          ))}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="mt-12 mb-8 text-center px-4 flex flex-col items-center">
        <div className="w-16 h-1 bg-gray-200 rounded-full mb-6"></div>
        <div className="flex items-center justify-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">
          <Sparkles size={12} /> Live • Love • Bake <Sparkles size={12} />
        </div>
        <p className="text-gray-400 text-[10px] font-medium">FSSAI Certified • Hyderabad</p>
      </footer>

      <QuickViewModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};
