import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, updateDocument, bulkUpdateDocuments, deleteDocument } from '../services/firestore';
import { Order, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, User, MapPin, Phone, X, Package, MessageCircle, Trash2, Filter, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['received', 'confirmed', 'baking', 'out_for_delivery', 'delivered', 'cancelled'] as const;

const STATUS_LABELS: Record<string, string> = {
  received: 'Pending',
  confirmed: 'Confirmed',
  baking: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_STYLE: Record<string, string> = {
  received:         'bg-[#E8F0FE] text-[#1967D2]',
  confirmed:        'bg-[#FEF7E0] text-[#B06000]',
  baking:           'bg-[#FEF7E0] text-[#B06000]',
  out_for_delivery: 'bg-[#FEF7E0] text-[#B06000]',
  delivered:        'bg-[#E6F4EA] text-[#1E8E3E]',
  cancelled:        'bg-[#FCE8E6] text-[#D93025]',
};

const CATEGORIES = ['All', 'Cakes', 'Brownies', 'Cupcakes', 'Cookies', 'Savories', 'Others'];

// ─── Order Detail Portal Drawer (Isolated & Stable) ─────────────────────────
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
      toast.success('Workflow updated');
      onClose();
    } finally { setSaving(false); }
  };

  if (!order) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      {/* Invisible backdrop that closes on click */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" 
        onClick={onClose} 
      />
      
      {/* Sliding Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
        className="relative bg-white w-full max-w-[428px] mx-auto rounded-t-[2.5rem] shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.5)] flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mt-4 shrink-0" />
        
        <div className="px-7 py-6 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Live Order Detail</p>
            <h2 className="text-2xl font-black text-gray-950 tracking-tighter">#{order.id.slice(-6).toUpperCase()}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-950 transition-colors"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 pb-40 space-y-8 no-scrollbar">
          {/* Information Card */}
          <div className="bg-[#F8F9FA] rounded-[2rem] p-6 space-y-5 border border-gray-100">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-gray-200 border border-gray-50"><User size={20}/></div>
                  <div>
                    <h4 className="text-sm font-black text-gray-950">{order.customer?.name || 'Guest'}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{order.customer?.phone || 'No Phone'}</p>
                  </div>
                </div>
                <a href={`tel:${order.customer?.phone}`} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-50"><Phone size={18}/></a>
             </div>
             
             <div className="pt-4 border-t border-gray-100/60 flex items-start gap-3">
               <MapPin size={16} className="text-gray-300 shrink-0 mt-0.5" />
               <p className="text-xs font-bold text-gray-600 leading-relaxed">{order.address?.street || 'No address provided'}</p>
             </div>
          </div>

          {/* Product Items */}
          <div className="space-y-3">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Items</p>
             <div className="bg-white border border-gray-50 rounded-[2rem] overflow-hidden divide-y divide-gray-50">
               {order.items?.map((item, i) => (
                 <div key={i} className="flex items-center gap-4 px-6 py-4">
                   <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-xs font-black text-gray-950">{item.quantity}</div>
                   <div className="flex-1">
                     <p className="text-xs font-black text-gray-950">{item.product?.name}</p>
                     {item.variant && <p className="text-[9px] text-gray-400 uppercase font-black mt-1 font-mono tracking-tighter">{item.variant.flavor} / {item.variant.weight}</p>}
                   </div>
                   <p className="text-xs font-black text-gray-950">₹{(item.product?.price || 0) * item.quantity}</p>
                 </div>
               ))}
               <div className="flex items-center justify-between px-6 py-5 bg-gray-50/20">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Total Value</span>
                 <span className="text-lg font-black text-gray-950">₹{order.total || 0}</span>
               </div>
             </div>
          </div>

          {/* Workflow */}
          <div className="space-y-4">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Update Status</p>
             <div className="grid grid-cols-2 gap-2.5">
               {STATUS_FLOW.map(s => (
                 <button 
                  key={s} 
                  onClick={() => setStatus(s)}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    status === s ? 'bg-gray-950 text-white border-gray-950 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                  }`}
                 >
                   {STATUS_LABELS[s]}
                 </button>
               ))}
             </div>
          </div>

          {/* Logistics */}
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Slot</p>
                  <div className="bg-gray-50 p-4 rounded-xl text-xs font-black text-gray-600">{order.deliverySlot || 'Standard'}</div>
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2 ml-1">Rider</p>
                  <input 
                    placeholder="Name" 
                    value={rider} 
                    onChange={e => setRider(e.target.value)}
                    className="w-full bg-gray-50 p-4 rounded-xl text-xs font-black text-gray-950 focus:outline-none border-2 border-transparent focus:border-gray-950"
                  />
               </div>
             </div>
          </div>

          <div className="flex justify-center pt-4 pb-12">
             <button 
               onClick={() => onDelete(order.id)}
               className="flex items-center gap-2 text-[10px] font-black text-gray-200 hover:text-red-500 transition-colors uppercase tracking-widest"
             >
               <Trash2 size={14}/> Remove Order Record
             </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-white border-t border-gray-50 pb-10">
           <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-gray-950 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50"
           >
             {saving ? 'Saving...' : 'Confirm Updates'}
           </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

// ─── Main Admin Dashboard Component ───────────────────────────────────────────
export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
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

  const stats = useMemo(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
      const revenue = orders
        .filter(o => o.createdAt && typeof o.createdAt === 'string' && o.createdAt.startsWith(today))
        .reduce((s, o) => s + (o.total || 0), 0);
      return { active, revenue };
    } catch { return { active: 0, revenue: 0 }; }
  }, [orders]);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !selectedIds.length) return;
    await bulkUpdateDocuments('orders', selectedIds, { status: bulkStatus });
    toast.success('Bulk update complete');
    setSelectedIds([]); setBulkStatus('');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
      <div className="w-10 h-10 border-4 border-t-transparent border-gray-950 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">Synchronizing Workflow</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-40 font-sans">
      
      {/* KPI Streamers */}
      <div className="grid grid-cols-2 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <div className="py-6 flex flex-col items-center border-r border-gray-50">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Queue Size</span>
          <span className="text-xl font-black text-gray-950 tabular-nums">{stats.active}</span>
        </div>
        <div className="py-6 flex flex-col items-center">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Incoming Revenue</span>
          <span className="text-xl font-black text-gray-950 tabular-nums">₹{stats.revenue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Filter Engine */}
      <div className="px-5 mt-6 space-y-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div className="p-2.5 bg-gray-950 rounded-2xl text-white shrink-0 shadow-lg shadow-gray-400/20"><Filter size={14}/></div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setSelectedIds([]); }}
              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                categoryFilter === cat ? 'bg-gray-950 text-white border-gray-950' : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {['All', ...STATUS_FLOW].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setSelectedIds([]); }}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {s === 'All' ? 'Every Stage' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Commando */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] bg-gray-950 rounded-[2.5rem] p-5 flex items-center gap-3 shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-2 shrink-0">
               <p className="text-xl font-black text-white leading-none">{selectedIds.length}</p>
               <p className="text-[8px] font-black text-gray-500 uppercase mt-1">Batch</p>
            </div>
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 appearance-none focus:outline-none"
            >
               <option value="" className="bg-gray-950">Set Workflow To...</option>
               {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-gray-950">{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={handleBulkUpdate} disabled={!bulkStatus} className="bg-white text-gray-950 text-[10px] font-black px-6 py-3 rounded-xl disabled:opacity-20 uppercase tracking-widest">Update</button>
            <button onClick={() => setSelectedIds([])} className="text-gray-500 hover:text-white"><X size={20}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-7 mt-8 mb-5">
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse " />
           <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Live Stream • {filteredOrders.length}</p>
         </div>
         <button 
           onClick={() => setSelectedIds(selectedIds.length === filteredOrders.length ? [] : filteredOrders.map(o => o.id))} 
           className="text-[9px] font-black uppercase tracking-widest text-gray-400 border border-gray-100 px-3 py-1.5 rounded-lg"
         >
           {selectedIds.length === filteredOrders.length ? 'Deselect Items' : 'Select All Output'}
         </button>
      </div>

      {/* Order Stream Tile Matches Snippet */}
      <div className="px-5 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-24 text-center opacity-20 flex flex-col items-center gap-4">
             <Package size={48}/>
             <p className="text-[10px] font-black uppercase tracking-widest">No matching orders in the stream</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isSelected = selectedIds.includes(order.id);
            const ss = STATUS_STYLE[order.status] ?? STATUS_STYLE['received'];
            
            return (
              <div 
                key={order.id}
                className={`bg-white rounded-[2rem] border transition-all flex overflow-hidden cursor-pointer group ${isSelected ? 'border-gray-950 ring-1 ring-gray-950 shadow-xl scale-[1.01]' : 'border-gray-100 shadow-sm'}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div 
                  className={`w-14 border-r flex items-center justify-center transition-colors ${isSelected ? 'bg-gray-950 text-white' : 'bg-gray-50/10 border-gray-50'}`}
                  onClick={e => { e.stopPropagation(); toggleSelect(order.id, e); }}
                >
                   <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${isSelected ? 'bg-white border-white text-gray-950' : 'bg-white border-gray-100 shadow-inner'}`}>
                      {isSelected && <Check size={14} strokeWidth={4} />}
                   </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col gap-4">
                   <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-gray-200 tracking-widest font-mono">#{order.id.slice(-4).toUpperCase()}</span>
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${ss}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                   </div>
                   
                   <div className="flex justify-between items-end">
                      <div className="min-w-0 flex-1">
                         <h3 className="text-base font-black text-gray-950 tracking-tight truncate">{order.customer?.name || 'Guest User'}</h3>
                         <div className="flex items-center gap-2 mt-2">
                           <MapPin size={12} className="text-gray-300 shrink-0" />
                           <p className="text-[11px] font-bold text-gray-400 tracking-tight truncate max-w-[200px]">{order.address?.street}</p>
                         </div>
                      </div>
                      <div className="text-right shrink-0 pl-4">
                         <div className="flex items-center justify-end gap-1 mb-2">
                            <Clock size={12} className="text-gray-300" />
                            <span className="text-base font-black text-gray-950 tabular-nums tracking-tighter">₹{order.total}</span>
                         </div>
                         <p className="text-[10px] font-black text-gray-200 uppercase tracking-widest">{order.items?.length || 0} SKUs</p>
                      </div>
                   </div>
                </div>
                
                <div className="w-12 border-l border-gray-50 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all">
                   <ChevronRight size={18} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Portal Drawer for maximum stability */}
      <AnimatePresence>
        {selectedOrder && (
          <DetailDrawer 
            key="order-portal"
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdate={async (id, updates) => { await updateDocument('orders', id, updates); }}
            onDelete={async (id) => { await deleteDocument('orders', id); setSelectedOrder(null); toast.success('Record removed'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};