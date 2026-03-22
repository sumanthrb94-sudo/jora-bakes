import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, updateDocument, bulkUpdateDocuments, deleteDocument, createDocument } from '../services/firestore';
import { Order, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, User, MapPin, Phone, X, Package, MessageCircle, Trash2, Filter, Clock, TrendingUp, LayoutGrid, Zap, PieChart, Plus, Edit2, Save, Power } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['received', 'confirmed', 'baking', 'out_for_delivery', 'delivered', 'cancelled'] as const;

const STATUS_LABELS: Record<string, string> = {
  received: 'Pending',
  confirmed: 'Confirmed',
  baking: 'Baking',
  out_for_delivery: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  received:         'bg-blue-50 text-blue-600',
  confirmed:        'bg-amber-50 text-amber-600',
  baking:           'bg-orange-50 text-orange-600',
  out_for_delivery: 'bg-emerald-50 text-emerald-600',
  delivered:        'bg-green-50 text-green-600',
  cancelled:        'bg-red-50 text-red-600',
};

const CATEGORIES = ['Cakes', 'Brownies', 'Cupcakes', 'Cookies', 'Savories', 'Others'];

// ─── Pro CRM: Order Detail Drawer ───────────────────────────────────────────
const DetailDrawer = ({ order, onClose, onUpdate, onDelete }: { 
  order: Order; 
  onClose: () => void;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [status, setStatus] = useState(order.status);
  const [rider, setRider] = useState(order.riderName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(order.id, { status, riderName: rider.trim() });
      toast.success('Record Updated');
      onClose();
    } catch (e) {
      toast.error('Sync Failed');
    } finally { setSaving(false); }
  };

  if (!order) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} 
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="relative bg-white w-full max-w-[480px] mx-auto rounded-t-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-32">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Order #{order.id.slice(-6).toUpperCase()}</h2>
            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900"><X size={20}/></button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-xs font-bold text-gray-900">{order.customer?.name}</p>
                 <p className="text-xs text-gray-500">{order.customer?.phone}</p>
               </div>
               <div className="flex gap-2">
                 <a href={`tel:${order.customer?.phone}`} className="p-2 bg-white rounded-lg border border-gray-100"><Phone size={14}/></a>
                 <a href={`https://wa.me/${order.customer?.phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-2 bg-white rounded-lg border border-gray-100"><MessageCircle size={14}/></a>
               </div>
             </div>
             <p className="text-xs text-gray-600 border-t border-gray-100 pt-3">{order.address?.street}</p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order Manifest</p>
            <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
              {order.items?.map((item, i) => (
                <div key={i} className="p-3 flex justify-between items-center text-xs">
                  <div className="flex gap-3 items-center">
                    <span className="font-bold text-gray-900">x{item.quantity}</span>
                    <div>
                      <p className="font-bold">{item.product?.name}</p>
                      {item.variant && <p className="text-[10px] text-gray-400">{item.variant.flavor} / {item.variant.weight}</p>}
                    </div>
                  </div>
                  <p className="font-bold">₹{(item.product?.price || 0) * item.quantity}</p>
                </div>
              ))}
              <div className="p-4 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Total Value</span>
                <span className="text-lg font-bold text-gray-900">₹{order.total}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Workflow Action</p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_FLOW.map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatus(s)}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border-2 transition-all ${
                    status === s ? 'bg-gray-950 border-gray-950 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl">
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assign Dispatcher</p>
             <input value={rider} onChange={e => setRider(e.target.value)} className="w-full bg-white border border-gray-100 p-3 rounded-lg text-xs" placeholder="Rider Name" />
          </div>

          <div className="flex justify-center pt-4">
             <button onClick={() => onDelete(order.id)} className="flex items-center gap-2 text-[10px] font-bold text-gray-300 hover:text-red-500 uppercase tracking-widest"><Trash2 size={14}/> Delete Permanent Record</button>
          </div>
        </div>

        <div className="absolute bottom-6 inset-x-6">
           <button onClick={handleSave} disabled={saving} className="w-full bg-gray-950 text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl active:scale-95 disabled:opacity-50">
             {saving ? 'Synchronizing...' : 'Save & Close'}
           </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

// ─── Pro CRM: Product Manager ───────────────────────────────────────────────
const ProductManager = ({ products, categories }: { products: Product[], categories: string[] }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});

  const handleToggle = async (product: Product) => {
    await updateDocument('products', product.id, { isAvailable: !product.isAvailable });
    toast.success(`${product.name} ${!product.isAvailable ? 'Activated' : 'Paused'}`);
  };

  const handleSave = async (id: string) => {
    await updateDocument('products', id, formData);
    setEditingId(null);
    toast.success('Product Updated');
  };

  const handleAddNew = async () => {
    if (!formData.name || !formData.price || !formData.category) {
       toast.error('Fill required fields'); return;
    }
    await createDocument('products', { ...formData, isAvailable: true });
    setAddingNew(false); setFormData({});
    toast.success('Added to Menu');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-950">Menu Management</h2>
        <button onClick={() => setAddingNew(true)} className="flex items-center gap-2 bg-gray-950 text-white px-4 py-2 rounded-xl text-xs font-bold"><Plus size={16}/> New SKU</button>
      </div>

      <div className="space-y-4">
        {addingNew && (
          <div className="bg-white border-2 border-dashed border-gray-100 p-6 rounded-3xl space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <input placeholder="Name" className="bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
               <input placeholder="Price" type="number" className="bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
               <select className="bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, category: e.target.value})}>
                 <option value="">Select Category</option>
                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <input placeholder="Weight (e.g. 500g)" className="bg-gray-50 p-3 rounded-xl text-sm" onChange={e => setFormData({...formData, weight: e.target.value})} />
            </div>
            <div className="flex gap-2">
               <button onClick={handleAddNew} className="flex-1 bg-gray-950 text-white py-3 rounded-xl text-xs font-bold">Create Product</button>
               <button onClick={() => setAddingNew(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-gray-400">Cancel</button>
            </div>
          </div>
        )}

        {products.map(p => (
          <div key={p.id} className={`bg-white rounded-3xl p-4 flex items-center gap-4 border border-gray-50 ${!p.isAvailable && 'opacity-60'}`}>
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-200"><Package size={20}/></div>
            <div className="flex-1">
              {editingId === p.id ? (
                <div className="flex gap-2">
                  <input className="bg-gray-50 px-2 py-1 rounded text-xs font-bold" defaultValue={p.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input className="bg-gray-50 px-2 py-1 rounded text-xs font-bold w-20" defaultValue={p.price} type="number" onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
              ) : (
                <>
                  <p className="text-sm font-bold text-gray-950">{p.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.category} • ₹{p.price}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleToggle(p)} className={`p-2 rounded-lg ${p.isAvailable ? 'text-emerald-500' : 'text-gray-300'}`}><Power size={18}/></button>
              {editingId === p.id ? (
                <button onClick={() => handleSave(p.id)} className="p-2 bg-gray-950 text-white rounded-lg"><Save size={16}/></button>
              ) : (
                <button onClick={() => { setEditingId(p.id); setFormData(p); }} className="p-2 bg-gray-50 text-gray-400 rounded-lg"><Edit2 size={16}/></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Pro CRM: Analytics Dashboard ───────────────────────────────────────────
const AnalyticsDashboard = ({ orders }: { orders: Order[] }) => {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const dailyRevenue = orders.filter(o => o.createdAt?.startsWith(today)).reduce((sum, o) => sum + (o.total || 0), 0);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    
    const catMix: Record<string, number> = {};
    orders.forEach(o => o.items?.forEach(i => {
       const cat = i.product?.category || 'Others';
       catMix[cat] = (catMix[cat] || 0) + i.quantity;
    }));

    return { dailyRevenue, totalRevenue, activeOrders, catMix };
  }, [orders]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-950">Analytics Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Today Revenue</p>
           <h3 className="text-2xl font-black tracking-tighter tabular-nums">₹{stats.dailyRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-gray-950 p-6 rounded-[2rem] text-white shadow-xl shadow-gray-200">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Queue Size</p>
           <h3 className="text-2xl font-black tracking-tighter tabular-nums">{stats.activeOrders} <span className="text-[10px] opacity-40">Orders</span></h3>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-50 space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Category Volume</p>
          <PieChart size={16} className="text-gray-200" />
        </div>
        <div className="space-y-4">
          {Object.entries(stats.catMix).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-4">
               <div className="w-2 h-2 rounded-full bg-indigo-500" />
               <p className="flex-1 text-[11px] font-bold text-gray-600">{cat}</p>
               <p className="text-[11px] font-black text-gray-950">{count}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-50 p-8 rounded-[2.5rem] text-center space-y-2">
         <p className="text-2xl font-black text-gray-950 tracking-tighter">₹{stats.totalRevenue.toLocaleString()}</p>
         <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300">Lifetime Gross Revenue</p>
      </div>
    </div>
  );
};

// ─── Main Admin CRM ──────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'analytics'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    if (!isAdmin) return;
    const unsubOrders = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    const unsubProducts = subscribeToCollection<Product>('products', setProducts);
    return () => { unsubOrders(); unsubProducts(); };
  }, [isAdmin]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchCat = categoryFilter === 'All' || o.items?.some(i => i.product?.category === categoryFilter);
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchCat && matchStatus;
    });
  }, [orders, categoryFilter, statusFilter]);

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !selectedIds.length) return;
    await bulkUpdateDocuments('orders', selectedIds, { status: bulkStatus });
    toast.success('Batch Synced');
    setSelectedIds([]); setBulkStatus('');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
      <div className="w-10 h-10 border-4 border-t-transparent border-gray-950 rounded-full animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-300">Syncing CRM</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-44 font-sans">
      
      {/* View Controller */}
      <div className="bg-white border-b border-gray-100 flex p-2 sticky top-0 z-[60]">
        {[
          { id: 'orders', label: 'Orders', Icon: Package },
          { id: 'products', label: 'Menu', Icon: LayoutGrid },
          { id: 'analytics', label: 'Stats', Icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 rounded-2xl transition-all ${
              activeTab === tab.id ? 'bg-gray-950 text-white shadow-lg' : 'text-gray-400'
            }`}
          >
            <tab.Icon size={18} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <div className="p-6 space-y-6">
           {/* Rapid Filter Bar */}
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <div className="px-3 bg-gray-950 text-white rounded-xl flex items-center shrink-0"><Filter size={14}/></div>
              {['All', ...CATEGORIES].map(cat => (
                <button
                  key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap border ${categoryFilter === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
           </div>

           <div className="space-y-4">
              {filteredOrders.map(order => (
                <div 
                  key={order.id} 
                  className={`bg-white rounded-2xl p-4 flex items-center gap-4 border ${selectedIds.includes(order.id) ? 'border-gray-950' : 'border-gray-50'}`}
                  onClick={() => setSelectedOrder(order)}
                >
                   <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedIds.includes(order.id) ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-200'}`}
                    onClick={e => { e.stopPropagation(); setSelectedIds(prev => prev.includes(order.id) ? prev.filter(x => x !== order.id) : [...prev, order.id]); }}
                   >
                     {selectedIds.includes(order.id) ? <Check size={18} /> : <div className="w-4 h-4 border-2 border-current rounded" />}
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-gray-300">#{order.id.slice(-4).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${STATUS_STYLE[order.status]}`}>{STATUS_LABELS[order.status]}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-950">{order.customer?.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium">₹{order.total} • {order.items?.length} items</p>
                   </div>
                   <ChevronRight size={16} className="text-gray-200" />
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'products' && <ProductManager products={products} categories={CATEGORIES} />}
      {activeTab === 'analytics' && <AnalyticsDashboard orders={orders} />}

      {/* Batch Commando */}
      <AnimatePresence>
        {selectedIds.length > 0 && activeTab === 'orders' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] bg-gray-950 rounded-3xl p-4 flex items-center gap-3 shadow-2xl z-50"
          >
            <div className="px-2 shrink-0"><p className="text-lg font-bold text-white">{selectedIds.length}</p></div>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="flex-1 bg-white/10 rounded-xl text-white text-[10px] font-bold uppercase px-3 py-3 appearance-none focus:outline-none"
            >
               <option value="" className="bg-gray-900">Update Status...</option>
               {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-gray-900">{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={handleBulkUpdate} className="bg-white text-gray-950 text-[10px] font-bold px-5 py-3 rounded-xl uppercase">Apply</button>
            <button onClick={() => setSelectedIds([])} className="text-gray-500"><X size={20}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <DetailDrawer 
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={async (id, updates) => { await updateDocument('orders', id, updates); }}
            onDelete={async (id) => { await deleteDocument('orders', id); setSelectedOrder(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};