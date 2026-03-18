import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, createDocument, updateDocument, deleteDocument } from '../services/firestore';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '../types';
import { products as staticProducts } from '../data/products'; // Fallback to import initial data
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Edit2, Trash2, Image as ImageIcon, Search, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminProducts = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: 'millet_brownies',
    isAvailable: true,
    stockQuantity: 10,
    images: [''],
  });

  useEffect(() => {
    if (!isAdmin && !authLoading) {
      navigate('/');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    if (isAdmin) {
      setLoading(true);
      unsubscribe = subscribeToCollection<Product>(
        'products',
        (fetchedProducts) => {
          setProducts(fetchedProducts);
          setLoading(false);
        },
        (error) => {
          console.error("Failed to fetch products:", error);
          toast.error("Failed to load products from database");
          setLoading(false);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin, authLoading, navigate]);

  const handleOpenModal = (product?: Product) => {
    setImageFile(null); // Reset file selection
    if (product) {
      setEditingId(product.id);
      setFormData({ ...product, stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : 10 });
    } else {
      setEditingId(null);
      setFormData({
        name: '', description: '', price: 0, category: 'millet_brownies', isAvailable: true, stockQuantity: 10, images: ['']
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill in required fields.');
      return;
    }
    
    if (!imageFile && (!formData.images || formData.images.length === 0 || !formData.images[0])) {
      toast.error('Please select an image.');
      return;
    }

    setIsSaving(true);

    let imageUrl = formData.images?.[0] || '';
    if (imageFile) {
      try {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      } catch (error) {
        console.error("Image upload failed:", error);
        toast.error("Failed to upload image.");
        setIsSaving(false);
        return;
      }
    }

    const productData = { ...formData, images: [imageUrl] };

    try {
      if (editingId) {
        await updateDocument('products', editingId, productData);
        toast.success('Product updated successfully!');
      } else {
        const newId = `p_${Date.now()}`;
        const newProduct = {
          ...productData,
          id: newId,
          variants: [{ id: 'v1', flavor: 'Default', priceModifier: 0, weight: '1 Unit' }], // Default variant
          isEggless: true, // Default to true based on your brand
          ingredients: [],
          allergens: [],
        };
        await createDocument('products', newProduct as Product, newId);
        toast.success('Product created successfully!');
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving product:", error);
      if (error.message && error.message.includes('permission')) {
        toast.error("Permission denied. Check Firestore Rules!");
      } else {
        toast.error("Failed to save product.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDocument('products', id);
        toast.success("Product deleted.");
        } catch (error: any) {
        console.error("Error deleting product:", error);
          if (error.message && error.message.includes('permission')) {
            toast.error("Permission denied. Check Firestore Rules!");
          } else {
            toast.error("Failed to delete product.");
          }
      }
    }
  };

  const handleSeedData = async () => {
    if (window.confirm("This will copy your static menu into the database. Proceed?")) {
      let successCount = 0;
      for (const p of staticProducts) {
        try {
          await createDocument('products', p, p.id);
          successCount++;
        } catch (e) {
          console.error("Failed to seed product", p.id);
        }
      }
      toast.success(`Successfully seeded ${successCount} products!`);
    }
  };

  const filteredProducts = products.filter(p => 
    (p?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (p?.category || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Manage Menu</h1>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[var(--color-terracotta)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="p-4 space-y-6">
        {products.length === 0 && !loading && (
          <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
            <Database size={40} className="mx-auto text-[var(--color-terracotta)] mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-[var(--color-chocolate)] mb-2">No Database Products</h2>
            <p className="text-gray-500 text-sm mb-4">Your Firestore database doesn't have any products yet.</p>
            <button onClick={handleSeedData} className="bg-[var(--color-sage)] text-white px-6 py-2 rounded-xl font-bold">
              Seed Initial Menu
            </button>
          </div>
        )}

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-white border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)] pr-10 shadow-sm"
          />
          <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-center">
                <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  {product.images && product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 mx-auto my-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[var(--color-chocolate)]">{product.name}</h3>
                    <span className="font-bold text-[var(--color-terracotta)]">₹{product.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 capitalize mb-2">{product.category.replace('_', ' ')}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${product.isAvailable && (product.stockQuantity === undefined || product.stockQuantity > 0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.isAvailable && (product.stockQuantity === undefined || product.stockQuantity > 0) ? 'In Stock' : 'Out of Stock'}
                    </span>
                    {product.stockQuantity !== undefined && (
                      <span className="text-xs text-gray-500 font-medium">Qty: {product.stockQuantity}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => handleOpenModal(product)} className="p-2 bg-gray-50 rounded-lg text-gray-600 hover:text-[var(--color-chocolate)] hover:bg-gray-100">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white rounded-t-3xl z-50 p-6 pb-safe max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-[var(--color-chocolate)] mb-6">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Product Name</label>
                  <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[var(--color-terracotta)]" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Price (₹)</label>
                    <input type="number" required value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[var(--color-terracotta)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Stock Qty</label>
                    <input type="number" required min="0" value={formData.stockQuantity !== undefined ? formData.stockQuantity : ''} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[var(--color-terracotta)]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Category</label>
                    <select value={formData.category || 'millet_brownies'} onChange={e => setFormData({...formData, category: e.target.value as any})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[var(--color-terracotta)]">
                      <option value="millet_brownies">Millet Brownies</option>
                      <option value="cheese_cakes">Cheese Cakes</option>
                      <option value="burnt_basque">Burnt Basque</option>
                      <option value="cupcakes">Cupcakes</option>
                      <option value="tiramisu">Tiramisu</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                  <textarea rows={3} required value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[var(--color-terracotta)] resize-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Product Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                    }} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-[var(--color-terracotta)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--color-beige)] file:text-[var(--color-terracotta)] hover:file:bg-[var(--color-cream)] cursor-pointer" 
                  />
                  {(imageFile || formData.images?.[0]) && (
                    <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                      <img src={imageFile ? URL.createObjectURL(imageFile) : formData.images?.[0]} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input type="checkbox" id="isAvailable" checked={formData.isAvailable || false} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} className="w-5 h-5 accent-[var(--color-terracotta)]" />
                  <label htmlFor="isAvailable" className="text-sm font-semibold text-gray-700">Currently in stock</label>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-[var(--color-terracotta)] text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center">
                    {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};