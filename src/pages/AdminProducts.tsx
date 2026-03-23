import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument } from '../services/firestore';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Image as ImageIcon, 
  Search, 
  Tag,
  RefreshCw,
  AlertCircle,
  Minus,
  Check,
  X,
  Database,
  ArrowRight,
  Package,
  CheckSquare,
  Square,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Millet Brownies', 'Cheese Cakes', 'Burnt Basque', 'Cupcakes', 'Tiramisu'];

interface GridCardProps {
  product: Product;
  onEdit: (p?: Product) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const GridCard: React.FC<GridCardProps> = ({ product, onEdit, isSelected, onSelect }) => {
  const isOutOfStock = (product.stockQuantity || 0) <= 0;
  const isSoldOut = !product.isAvailable || isOutOfStock;
  
  return (
    <motion.div 
      layout
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm flex flex-col relative group cursor-pointer transition-all ${
        isSelected ? 'border-[var(--color-admin-dark)] ring-2 ring-[var(--color-admin-dark)]/10' : 'border-gray-100'
      }`}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.select-zone')) return;
        onEdit(product);
      }}
    >
      {/* Selection Checkbox */}
      <div 
        className="select-zone absolute top-3 right-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
        onClick={(e) => {
           e.stopPropagation();
           onSelect?.(product.id);
        }}
      >
         <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${
           isSelected 
             ? 'bg-[var(--color-admin-dark)] border-[var(--color-admin-dark)] text-white' 
             : 'bg-white/80 border-gray-200 text-gray-400 opacity-0 group-hover:opacity-100'
         }`}>
            {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
         </div>
      </div>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 items-center">
         {/* Green Veg Dot (Eggless Indicator) */}
         <div className="w-4 h-4 border-2 border-[#00B189] rounded-sm flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="w-2 h-2 bg-[#00B189] rounded-full" />
         </div>
         
         {(product.discountPercentage || 0) > 0 && (
           <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-[#FF4B4B] text-white">
             -{product.discountPercentage}%
           </span>
         )}
      </div>

      {/* Stock Critical Banner */}
      {isOutOfStock && (
        <div className="absolute top-10 left-3 z-10">
           <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-[#FF4B4B] text-white border border-white/20">
             CRITICAL: STOCK OUT
           </span>
        </div>
      )}

      {/* Product Image */}
      <div className={`aspect-[4/3] relative overflow-hidden bg-gray-50 ${isSoldOut ? 'grayscale-70' : ''}`}>
         {product.images?.[0] ? (
           <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={32} /></div>
         )}
         {isSoldOut && (
           <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <span className="bg-[#FF4B4B] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded shadow-lg">SOLD OUT</span>
           </div>
         )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
         <div className="flex justify-between items-start mb-1">
            <h3 className="text-sm font-black text-[var(--color-admin-dark)] truncate flex-1">{product.name}</h3>
            <span className="text-[9px] font-black text-gray-300 tracking-widest bg-gray-50 px-1.5 py-0.5 rounded">V.1.0</span>
         </div>
         <p className="text-[10px] text-gray-400 font-bold mb-4 uppercase tracking-wider line-clamp-1">
            {product.category.replace('_', ' ')}
         </p>
         
         <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
               {product.mrp && product.mrp > product.price && (
                 <span className="text-[10px] text-gray-300 font-black line-through leading-none mb-0.5">Rs. {product.mrp}</span>
               )}
               <span className="text-base font-black text-[var(--color-admin-dark)] leading-none">Rs. {product.price}</span>
            </div>
            {isOutOfStock ? (
              <div className="bg-[#FFEAEA] text-[#FF4B4B] px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-[#FFD6D6]">
                 <div className="w-1.5 h-1.5 bg-[#FF4B4B] rounded-full" />
                 OUT OF STOCK
              </div>
            ) : (
              <div className="bg-[#E6F4EA] text-[#1E8E3E] px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-[#D1F2DB]">
                 <div className="w-1.5 h-1.5 bg-[#1E8E3E] rounded-full" />
                 IN STOCK
              </div>
            )}
         </div>
      </div>
    </motion.div>
  );
};

export const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  
  // Form State - Reflecting the Reference Image
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', 
    description: '', 
    price: 0, 
    mrp: 0,
    discountPercentage: 0,
    category: 'millet_brownies', 
    isAvailable: true, 
    stockQuantity: 10, 
    images: [''],
  });

  useEffect(() => {
    const unsub = subscribeToCollection<Product>('products', (data) => {
      setProducts(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory.toLowerCase().replace(' ', '_');
    return matchesSearch && matchesCategory;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkCategoryChange = async (category: string) => {
    if (selectedIds.length === 0 || isBulkLoading) return;
    if (!window.confirm(`Update ${selectedIds.length} products to category: ${category.replace('_', ' ')}?`)) return;
    
    setIsBulkLoading(true);
    const loadingToast = toast.loading(`Updating ${selectedIds.length} items...`);
    
    try {
      const updates = selectedIds.map(id => updateDocument('products', id, { category: category.toLowerCase().replace(/\s+/g, '_') }));
      await Promise.all(updates);
      toast.success(`Successfully updated ${selectedIds.length} products`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Bulk update failed');
    } finally {
      setIsBulkLoading(false);
      toast.dismiss(loadingToast);
    }
  };

  const handleOpenForm = (product?: Product) => {
    setImageFile(null);
    if (product) {
      setEditingId(product.id);
      setFormData({ ...product, price: product.price || 0, mrp: product.mrp || product.price || 0, discountPercentage: product.discountPercentage || 0 });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', price: 0, mrp: 0, discountPercentage: 0, category: 'millet_brownies', isAvailable: true, stockQuantity: 10, images: [''] });
    }
    setShowForm(true);
  };

  // Recalculate price when MRP or Discount changes
  const updatePricing = (field: 'mrp' | 'discount', value: number) => {
     setFormData(prev => {
        const newData = { ...prev };
        if (field === 'mrp') newData.mrp = value;
        else newData.discountPercentage = value;
        
        const mrp = newData.mrp || 0;
        const discount = newData.discountPercentage || 0;
        newData.price = Math.round(mrp * (1 - discount / 100));
        return newData;
     });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return toast.error('Missing required fields');
    setIsSaving(true);
    let imageUrl = formData.images?.[0] || '';
    if (imageFile) {
      try {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (err) { toast.error("Upload failed"); setIsSaving(false); return; }
    }
    const productData = { ...formData, images: [imageUrl] };
    try {
      if (editingId) await updateDocument('products', editingId, productData);
      else { const newId = `p_${Date.now()}`; await createDocument('products', { ...productData, id: newId } as Product, newId); }
      setShowForm(false);
      toast.success('Deployed to Catalog');
    } catch (e) { toast.error("Save failed"); } finally { setIsSaving(false); }
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-[var(--color-admin-dark)] border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Indexing Assets</span>
     </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div 
            key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6"
          >
              <div className="flex items-end justify-between sticky top-0 z-20 bg-[#F5F5F7] pb-3 pt-1">
                <div className="flex items-center gap-4">
                   <div 
                      className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={toggleSelectAll}
                   >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${
                        selectedIds.length === filteredProducts.length && filteredProducts.length > 0
                          ? 'bg-[var(--color-admin-dark)] border-[var(--color-admin-dark)] text-white'
                          : 'border-gray-200 text-transparent'
                      }`}>
                         <Check size={12} strokeWidth={4} />
                      </div>
                   </div>
                   <div className="flex flex-col">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-1.5 flex items-center gap-2">
                        Product Management
                        {selectedIds.length > 0 && <span className="bg-[var(--color-admin-dark)] text-white px-2 py-0.5 rounded-full text-[8px] animate-in zoom-in">{selectedIds.length} SELECTED</span>}
                     </p>
                     <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter leading-none italic">Products.</h1>
                   </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenForm()}
                  className="bg-[#1D1D1F] text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 flex items-center gap-2"
                >
                  <Plus size={16} /> New SKU
                </motion.button>
             </div>

             <div className="space-y-4">
                <div className="relative group px-1">
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search catalog..." 
                    className="w-full bg-white border border-gray-100 rounded-2xl px-12 py-4 text-xs font-bold focus:ring-0 outline-none shadow-sm transition-all" />
                  <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-1">
                   {CATEGORIES.map(cat => (
                     <motion.button
                       key={cat}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all ${
                         selectedCategory === cat ? 'bg-[var(--color-admin-dark)] text-white' : 'bg-white border border-gray-100 text-gray-300'
                       }`}
                     >
                       {cat}
                     </motion.button>
                   ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 px-1">
                {filteredProducts.map(p => (
                  <GridCard 
                    key={p.id} 
                    product={p} 
                    onEdit={handleOpenForm}
                    isSelected={selectedIds.includes(p.id)}
                    onSelect={toggleSelect}
                  />
                ))}
             </div>

             {/* Bulk Action Bar */}
             <AnimatePresence>
                {selectedIds.length > 0 && (
                   <motion.div
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
                   >
                      <div className="bg-[#1D1D1F] rounded-[2.5rem] p-4 shadow-2xl border border-white/10 backdrop-blur-xl">
                         <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                  <Filter size={16} />
                               </div>
                               <div>
                                  <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Bulk Action</p>
                                  <p className="text-xs font-black text-white tracking-tight">Move to Category</p>
                               </div>
                            </div>
                            <button 
                               onClick={() => setSelectedIds([])}
                               className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                               <X size={18} />
                            </button>
                         </div>

                         <div className="grid grid-cols-3 gap-2">
                            {CATEGORIES.filter(c => c !== 'All').map(cat => (
                               <button
                                  key={cat}
                                  onClick={() => handleBulkCategoryChange(cat)}
                                  className="py-3 px-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[8px] font-black text-white uppercase tracking-widest transition-all text-center leading-tight h-12 flex items-center justify-center"
                               >
                                  {cat}
                               </button>
                            ))}
                         </div>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            key="form" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
            className="space-y-8 bg-white fixed inset-0 z-[100] min-h-screen overflow-y-auto p-6 md:p-12"
          >
             <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
                <button onClick={() => setShowForm(false)} className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full text-gray-400">
                   <ArrowRight className="rotate-180" size={20} />
                </button>
                <h2 className="text-xl font-black text-[var(--color-admin-dark)] uppercase tracking-tight">Sync SKU: {formData.name || 'New Item'}</h2>
                <div className="w-10" />
             </div>

             <form onSubmit={handleSave} className="space-y-8 max-w-2xl mx-auto w-full pb-20">
                {/* Asset Upload */}
                <div className="relative aspect-video rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden group">
                    {imageFile || formData.images?.[0] ? (
                        <img src={imageFile ? URL.createObjectURL(imageFile) : formData.images?.[0]} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="text-center">
                           <ImageIcon size={32} className="mx-auto text-gray-200 mb-3" />
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Select Product Asset</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-[8px] font-black uppercase tracking-widest text-gray-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">Change Media</div>
                </div>

                {/* Product Identity Section */}
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Product Identity</h3>
                   <div className="space-y-4">
                      <input type="text" required placeholder="Name (e.g. Millet Brownie)" value={formData.name || ''} 
                        onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
                      
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none">
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c.toLowerCase().replace(' ', '_')}>{c}</option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">MRP (Rs. )</label>
                            <input type="number" required value={formData.mrp || ''} onChange={e => updatePricing('mrp', Number(e.target.value))} 
                              className="w-full bg-transparent border-none p-0 text-xl font-black text-[var(--color-admin-dark)] focus:ring-0" />
                         </div>
                         <div className="bg-gray-50 p-6 rounded-3xl space-y-3">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Discount %</label>
                            <div className="flex items-center">
                               <input type="number" value={formData.discountPercentage || ''} onChange={e => updatePricing('discount', Number(e.target.value))} 
                                 className="w-full bg-transparent border-none p-0 text-xl font-black text-[var(--color-admin-dark)] focus:ring-0" />
                               <span className="text-gray-400 font-black text-base">%</span>
                            </div>
                         </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-3xl flex items-center justify-between">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest tracking-[0.2em]">Final Price</label>
                         <span className="text-2xl font-black text-[#00B189]">Rs. {formData.price}</span>
                      </div>
                   </div>
                </div>

                {/* Inventory Status */}
                <div className="space-y-4">
                   <div className="bg-gray-50 p-6 rounded-3xl flex items-center justify-between">
                      <div>
                         <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">In Stock Status</h3>
                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Available for purchase</p>
                      </div>
                      <motion.button 
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                        className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${formData.isAvailable ? 'bg-[#00B189]' : 'bg-gray-200'}`}
                      >
                         <motion.div 
                           layout
                           transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                           className={`absolute top-1 w-4 h-4 bg-white rounded-full ${formData.isAvailable ? 'right-1' : 'left-1'}`} 
                         />
                      </motion.button>
                   </div>

                   <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inventory Quantity</label>
                      <div className="flex items-center gap-4">
                         <input type="number" required value={formData.stockQuantity !== undefined ? formData.stockQuantity : ''} 
                           onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} 
                           className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-[var(--color-admin-dark)]" />
                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Units</span>
                      </div>
                   </div>
                </div>

                {/* Metadata */}
                <div className="space-y-4 text-center">
                   <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Description & Ingredients</h3>
                   <textarea rows={4} placeholder="Enter operational highlights..." value={formData.description || ''} 
                     onChange={e => setFormData({...formData, description: e.target.value})} 
                     className="w-full border-2 border-gray-50 rounded-[2rem] px-6 py-5 text-sm font-bold text-gray-500 placeholder:text-gray-200 focus:border-[var(--color-admin-dark)] transition-colors resize-none" />
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-6 bg-[var(--color-admin-dark)] text-white text-xs font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                   {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <><Package size={20} /> Deploy to Catalog</>}
                </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
