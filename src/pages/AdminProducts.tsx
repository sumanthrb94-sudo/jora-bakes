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
  onDelete: (id: string) => void;
}

const GridCard: React.FC<GridCardProps> = ({ product, onEdit, onDelete }) => {
  const isOutOfStock = (product.stockQuantity || 0) <= 0;
  const isSoldOut = !product.isAvailable || isOutOfStock;
  
  return (
    <motion.div 
      layout
      whileHover={{ y: -8, boxShadow: '0 40px 80px -20px rgba(210, 110, 75, 0.12)' }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-[2.5rem] border border-[#E8E2D9] hover:border-[#D26E4B]/40 overflow-hidden shadow-sm flex flex-col relative group cursor-pointer transition-all duration-700"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.action-zone')) return;
        onEdit(product);
      }}
    >
      {/* Action Zone - Always visible on mobile, group-hover on desktop */}
      <div className="action-zone absolute top-4 right-4 z-20 flex flex-col gap-2">
         {/* Edit Action */}
         <div 
           className="w-10 h-10 rounded-2xl flex items-center justify-center border border-[#E8E2D9] bg-white text-[#D26E4B] shadow-xl hover:bg-[#FDF2F0] transition-all duration-300 md:opacity-0 md:group-hover:opacity-100"
           onClick={(e) => {
              e.stopPropagation();
              onEdit(product);
           }}
         >
            <Edit2 size={16} />
         </div>

         {/* Delete Action */}
         <div 
           className="w-10 h-10 rounded-2xl flex items-center justify-center border border-[#E8E2D9] bg-white text-[#C17A6B] shadow-xl hover:bg-[#F9F1F0] transition-all duration-300 md:opacity-0 md:group-hover:opacity-100"
           onClick={(e) => {
              e.stopPropagation();
              onDelete(product.id);
           }}
         >
            <Trash2 size={16} />
         </div>
      </div>

      {/* Hero Asset */}
      <div className="aspect-[4/5] relative overflow-hidden bg-[#FAF7F2]">
        <img 
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=500&auto=format&fit=crop'} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms] ease-out" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1412]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {isSoldOut && (
          <div className="absolute inset-0 bg-[#1C1412]/40 backdrop-blur-[6px] flex items-center justify-center p-6 text-center">
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-[10px] font-black text-[#1C1412] uppercase tracking-[0.3em] bg-white/90 px-6 py-4 rounded-full shadow-2xl border border-white/20 italic"
            >
              Archived Item
            </motion.span>
          </div>
        )}

        {/* Dynamic Badges */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
           {(product.discountPercentage || 0) > 0 && (
             <div className="bg-[#D26E4B] text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#D26E4B]/30 w-fit italic">
               -{product.discountPercentage}% OFF
             </div>
           )}
        </div>
      </div>

      {/* Card Detail */}
      <div className="p-6 flex-1 flex flex-col bg-white">
         <div className="flex justify-between items-start gap-4 mb-3">
            <h3 className="text-[14px] font-black text-[#1C1412] tracking-tighter leading-snug line-clamp-2 uppercase italic group-hover:text-[#D26E4B] transition-colors">{product.name}</h3>
            <span className="shrink-0 text-[10px] font-black text-[#8B8680] italic tracking-widest opacity-40">#0{product.id.slice(-3)}</span>
         </div>
         
         <div className="mt-auto pt-6 flex items-end justify-between border-t border-[#F5F0E8]">
            <div className="flex flex-col">
               {product.mrp && product.mrp > product.price && (
                 <span className="text-[12px] text-[#8B8680]/50 font-black italic line-through leading-none mb-2">Rs. {product.mrp}</span>
               )}
               <div className="flex items-baseline gap-1.5">
                 <span className="text-[10px] font-black text-[#8B8680] italic">Rs.</span>
                 <span className="text-2xl font-black text-[#1C1412] tracking-tighter leading-none italic">{product.price}</span>
               </div>
            </div>
            
            <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] flex items-center gap-2 border transition-all shadow-sm ${
              isOutOfStock 
                ? 'bg-[#F9F1F0] text-[#C17A6B] border-[#C17A6B]/20' 
                : 'bg-[#F0F2EF] text-[#7A8B6E] border-[#7A8B6E]/20'
            }`}>
               <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-[#C17A6B] animate-pulse' : 'bg-[#7A8B6E]'}`} />
               {isOutOfStock ? 'Depleted' : 'In Shop'}
            </div>
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

  // Delete Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setProductToDelete(product);
      setShowDeleteModal(true);
    }
  };

  const handleArchive = async () => {
    if (!productToDelete) return;
    setIsSaving(true);
    try {
      await updateDocument('products', productToDelete.id, { 
        isAvailable: false, 
        stockQuantity: 0 
      });
      toast.success('Product archived (Out of Stock)');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to archive product');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!productToDelete) return;
    setIsSaving(true);
    try {
      await deleteDocument('products', productToDelete.id);
      toast.success('Product removed permanently');
      setShowDeleteModal(false);
    } catch (err) {
      toast.error('Failed to delete product');
    } finally {
      setIsSaving(false);
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
     <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <motion.div
           animate={{ rotate: 360, scale: [1, 1.1, 1] }}
           transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
           className="w-12 h-12 border-4 border-[#E8E2D9] border-t-[#D26E4B] rounded-full shadow-lg"
        />
        <span className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Auditing Catalog Assets</span>
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
              <div className="flex items-end justify-between sticky top-0 z-20 bg-[#FAF7F2] pb-6 pt-2">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                     <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] leading-none mb-2 italic">
                        In-Shop Ledger
                     </p>
                     <h1 className="text-4xl font-black text-[#1C1412] tracking-tighter leading-none italic uppercase">Inventory.</h1>
                   </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOpenForm()}
                  className="bg-[#1C1412] text-white px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 flex items-center justify-center italic hover:bg-[#2D2422] transition-all"
                >
                  Create Item
                </motion.button>
              </div>

              <div className="space-y-6">
                <div className="relative group px-1">
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search catalog..." 
                    className="w-full bg-white border border-[#E8E2D9] rounded-[2rem] px-14 py-5 text-sm font-bold focus:ring-2 focus:ring-[#D26E4B]/10 outline-none shadow-sm focus:border-[#D26E4B] transition-all text-[#1C1412] placeholder:text-[#8B8680]/50" />
                  <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D26E4B] group-focus-within:scale-110 transition-transform" />
                </div>

                <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar px-1 pb-2">
                   {CATEGORIES.map(cat => (
                     <motion.button
                       key={cat}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-6 py-3 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 border ${
                         selectedCategory === cat 
                           ? 'bg-[#1C1412] text-white border-[#1C1412] shadow-xl shadow-black/20 italic' 
                           : 'bg-white border-[#E8E2D9] text-[#8B8680] hover:border-[#D26E4B] hover:text-[#D26E4B]'
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
                    onDelete={handleDelete}
                  />
                ))}
              </div>

          </motion.div>
        ) : (
          <motion.div 
            key="form" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} 
            className="space-y-8 bg-[#FAF7F2] fixed inset-0 z-[100] min-h-screen overflow-y-auto p-6 md:p-12 selection:bg-[#D26E4B] selection:text-white"
          >
             <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
                <button onClick={() => setShowForm(false)} className="w-12 h-12 flex items-center justify-center bg-white border border-[#E8E2D9] rounded-2xl text-[#1C1412] hover:bg-[#F2E8E4] transition-all shadow-sm">
                   <ArrowRight className="rotate-180" size={20} />
                </button>
                <div className="text-center">
                   <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-1 italic">Synchronization Mode</p>
                   <h2 className="text-xl font-black text-[#1C1412] uppercase tracking-tighter italic">{formData.name || 'Undefined Item'}</h2>
                </div>
                <div className="w-12" />
             </div>

             <form onSubmit={handleSave} className="space-y-10 max-w-2xl mx-auto w-full pb-32">
                {/* Asset Upload */}
                <div className="relative aspect-video rounded-[3rem] bg-white border border-[#E8E2D9] flex flex-col items-center justify-center overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-700">
                    {imageFile || formData.images?.[0] ? (
                        <div className="w-full h-full relative">
                          <img src={imageFile ? URL.createObjectURL(imageFile) : formData.images?.[0]} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-[#1C1412]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ) : (
                        <div className="text-center">
                           <div className="w-16 h-16 bg-[#FAF7F2] rounded-3xl flex items-center justify-center text-[#D26E4B] mx-auto mb-4 border border-[#E8E2D9]">
                              <ImageIcon size={28} />
                           </div>
                           <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Commit Primary Asset</p>
                        </div>
                    )}
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && setImageFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <div className="absolute bottom-6 bg-[#1C1412] text-[9px] font-black text-white uppercase tracking-[0.3em] px-6 py-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 italic">Update Ledger Asset</div>
                </div>

                {/* Product Identity Section */}
                <div className="space-y-6">
                   <h3 className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.4em] italic leading-none ml-2">General Specification</h3>
                   <div className="space-y-4">
                      <div className="relative group">
                        <input type="text" required placeholder="Nomenclature (e.g. Millet Brownie)" value={formData.name || ''} 
                          onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-[#E8E2D9] rounded-[2rem] px-8 py-5 text-sm font-bold text-[#1C1412] focus:border-[#D26E4B] outline-none shadow-sm transition-all" />
                      </div>
                      
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-white border border-[#E8E2D9] rounded-[2rem] px-8 py-5 text-sm font-black text-[#1C1412] appearance-none outline-none shadow-sm focus:border-[#D26E4B] transition-all uppercase italic tracking-[0.1em]">
                        {CATEGORIES.filter(c => c !== 'All').map(c => (
                          <option key={c} value={c.toLowerCase().replace(' ', '_')}>{c}</option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E2D9] space-y-4 shadow-sm hover:border-[#D26E4B]/30 transition-all">
                            <label className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.2em] italic">Market Quote (Rs.)</label>
                            <input type="number" value={formData.mrp} onChange={e => updatePricing('mrp', Number(e.target.value))} 
                              className="w-full bg-transparent border-none p-0 text-3xl font-black text-[#1C1412] tracking-tighter focus:ring-0 italic" />
                         </div>
                         <div className="bg-white p-8 rounded-[2.5rem] border border-[#E8E2D9] space-y-4 shadow-sm hover:border-[#D26E4B]/30 transition-all">
                            <label className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.2em] italic">Campaign Offer (%)</label>
                            <div className="flex items-center gap-2">
                               <input type="number" value={formData.discountPercentage || ''} onChange={e => updatePricing('discount', Number(e.target.value))} 
                                 className="w-full bg-transparent border-none p-0 text-3xl font-black text-[#D26E4B] tracking-tighter focus:ring-0 italic" />
                               <span className="text-[#D26E4B] font-black text-2xl italic">%</span>
                            </div>
                         </div>
                      </div>

                      <div className="bg-[#1C1412] p-8 rounded-[3rem] flex items-center justify-between shadow-2xl">
                         <div className="flex flex-col">
                            <label className="text-[11px] font-black text-[#D4AF37] uppercase tracking-[0.4em] italic mb-1">Settlement Price</label>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Calculated post-discount</p>
                         </div>
                         <span className="text-4xl font-black text-white italic tracking-tighter">Rs. {formData.price}</span>
                      </div>
                   </div>
                </div>

                {/* Inventory Status */}
                <div className="space-y-6">
                   <h3 className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.4em] italic leading-none ml-2">Stock Manifest</h3>
                   <div className="bg-white border border-[#E8E2D9] p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                      <div>
                         <h3 className="text-[10px] font-black text-[#1C1412] uppercase tracking-[0.2em] leading-none mb-2">Visibility Protocol</h3>
                         <p className="text-[9px] text-[#8B8680] font-bold uppercase tracking-widest">Public Catalog Presence</p>
                      </div>
                      <motion.button 
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setFormData({...formData, isAvailable: !formData.isAvailable})}
                        className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${formData.isAvailable ? 'bg-[#7A8B6E]' : 'bg-[#E8E2D9]'}`}
                      >
                         <motion.div 
                           layout
                           transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                           className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg ${formData.isAvailable ? 'right-1' : 'left-1'}`} 
                         />
                      </motion.button>
                   </div>

                   <div className="bg-white border border-[#E8E2D9] p-8 rounded-[2.5rem] space-y-4 shadow-sm">
                      <label className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.2em] italic">Available Units</label>
                      <div className="flex items-center gap-6">
                         <input type="number" required value={formData.stockQuantity !== undefined ? formData.stockQuantity : ''} 
                           onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} 
                           className="flex-1 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl px-6 py-4 text-xl font-black text-[#1C1412] italic shadow-inner outline-none focus:border-[#D26E4B]" />
                         <span className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic shrink-0">Quantum</span>
                      </div>
                   </div>
                </div>

                {/* Metadata */}
                <div className="space-y-6 text-center">
                   <h3 className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.4em] italic leading-none ml-2">Chef's Description</h3>
                   <textarea rows={6} placeholder="Describe the flavor profile, ingredients, and operational highlights..." value={formData.description || ''} 
                     onChange={e => setFormData({...formData, description: e.target.value})} 
                     className="w-full bg-white border border-[#E8E2D9] rounded-[3rem] px-10 py-8 text-sm font-bold text-[#1C1412] placeholder:text-[#8B8680]/30 focus:border-[#D26E4B] transition-all resize-none shadow-sm italic leading-relaxed" />
                </div>

                <button type="submit" disabled={isSaving} className="w-full py-8 bg-[#1C1412] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[3rem] shadow-2xl shadow-black/30 active:scale-95 transition-all flex items-center justify-center gap-4 italic">
                   {isSaving ? <RefreshCw className="animate-spin" size={24} /> : <><Database size={24} className="text-[#D4AF37]" /> Commit to Ledger</>}
                </button>
             </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#1C1412]/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden shadow-2xl border border-[#E8E2D9]"
            >
              <div className="p-10 space-y-8 text-center">
                <div className="w-20 h-20 bg-[#FAF7F2] rounded-full flex items-center justify-center text-[#C17A6B] mx-auto border-4 border-[#F9F1F0] shadow-inner mb-2">
                  <AlertCircle size={36} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] italic">Operational Choice</p>
                  <h3 className="text-xl font-black text-[#1C1412] italic tracking-tighter leading-tight uppercase">
                    Remove {productToDelete.name}?
                  </h3>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleArchive}
                    disabled={isSaving}
                    className="w-full py-5 bg-[#FAF7F2] border border-[#E8E2D9] text-[#1C1412] rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-[#F2E8E4] transition-all italic"
                  >
                    <Package size={18} className="text-[#D26E4B]" /> {isSaving ? 'Processing...' : 'Archive (Out of Stock)'}
                  </button>
                  
                  <button
                    onClick={handlePermanentDelete}
                    disabled={isSaving}
                    className="w-full py-5 bg-[#1C1412] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all italic shadow-xl shadow-black/20"
                  >
                    <Trash2 size={18} className="text-[#C17A6B]" /> {isSaving ? 'Deleting...' : 'Delete Permanently'}
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isSaving}
                    className="w-full py-4 text-[9px] font-black text-[#8B8680] uppercase tracking-[0.3em] hover:text-[#1C1412] transition-colors mt-2 italic"
                  >
                    Abort Action
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
