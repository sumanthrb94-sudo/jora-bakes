import React, { useState, useEffect } from 'react';
import { subscribeToCollection, updateDocument, bulkUpdateDocuments } from '../services/firestore';
import { Order } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star,
  ChevronRight,
  X,
  Phone,
  MapPin,
  Check,
  Package,
  AlertCircle,
  Clock,
  LayoutGrid,
  Filter,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'proving', 'oven', 'cooling', 'ready_for_collection', 'out_for_delivery', 'delivered', 'cancelled'];

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'success' | 'info' | 'default' | 'error' | 'warning' }) => {
  const styles = {
    success: 'bg-emerald-50 text-emerald-600',
    info: 'bg-blue-50 text-blue-600',
    error: 'bg-red-50 text-red-600',
    warning: 'bg-orange-50 text-orange-600',
    default: 'bg-gray-100 text-gray-400'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
};

const OrderDetailsModal = ({ order, onClose, onUpdateStatus }: { order: Order | null, onClose: () => void, onUpdateStatus: (id: string, s: string) => void }) => {
  if (!order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#1C1412]/40 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        <motion.div 
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          className="w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl overflow-hidden relative z-[201] flex flex-col max-h-[90vh]"
        >
           {/* Modal Header */}
           <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1">Order Details</p>
                 <h2 className="text-2xl font-black text-[#1D1D1F] uppercase tracking-tight italic">#{order.id.slice(-6).toUpperCase()}</h2>
              </div>
              <button onClick={onClose} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 border border-gray-100/50">
                 <X size={20} />
              </button>
           </div>

           <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar pb-32">
              {/* Customer Info */}
              <div className="space-y-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-[var(--color-admin-dark)]">
                       <Star size={20} />
                    </div>
                    <div>
                       <h3 className="text-base font-black text-[var(--color-admin-dark)] leading-none">Customer Info</h3>
                       <p className="text-xs font-bold text-gray-400 mt-1">ID: {order.userId.slice(-8)}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                       <Phone size={16} className="text-gray-300" />
                       <span className="text-sm font-bold text-[var(--color-admin-dark)]">{order.customer.phone || 'No phone provided'}</span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                       <MapPin size={16} className="text-gray-300 shrink-0 mt-0.5" />
                       <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--color-admin-dark)]">{order.address.street}</span>
                          {order.address.label && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Label: {order.address.label}</span>}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Items Summary */}
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Itemization ({order.items.length})</h3>
                 <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[var(--color-admin-dark)] shadow-sm">{item.quantity}x</div>
                            <div className="flex flex-col">
                               <span className="text-sm font-black text-[var(--color-admin-dark)] tracking-tight">{item.product.name}</span>
                               {item.variant && <span className="text-[10px] font-bold text-gray-400 capitalize">{item.variant.flavor} ({item.variant.weight})</span>}
                            </div>
                         </div>
                         <span className="font-black text-sm text-[var(--color-admin-dark)]">₹{item.product.price * item.quantity}</span>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Status Management - Pro Grid */}
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Update Operations Status</h3>
                 <div className="grid grid-cols-2 gap-3">
                    {STATUS_STEPS.map((step) => (
                      <motion.button
                        key={step}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onUpdateStatus(order.id, step)}
                        className={`p-4 rounded-2xl flex flex-col gap-2 border transition-all ${
                          order.status === step 
                            ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white shadow-xl shadow-black/10' 
                            : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                        }`}
                      >
                         <span className="text-[10px] font-black uppercase tracking-widest">{step.replace('_', ' ')}</span>
                         {order.status === step && <div className="w-1 h-1 bg-white rounded-full mx-auto" />}
                      </motion.button>
                    ))}
                 </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 p-6 rounded-[2rem] space-y-3">
                 <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>Subtotal</span>
                    <span>₹{order.total}</span>
                 </div>
                 <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>Delivery</span>
                    <span className="text-green-600">FREE</span>
                 </div>
                 <div className="h-px bg-gray-200 my-1 border-dashed border-gray-300" />
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-[var(--color-admin-dark)] uppercase tracking-widest">Grand Total</span>
                    <span className="text-xl font-black text-[var(--color-admin-dark)] tracking-tighter">₹{order.total}</span>
                 </div>
              </div>
           </div>

           {/* Sticky Action Footer */}
           <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
              <button onClick={onClose} className="w-full py-6 bg-[var(--color-admin-dark)] text-white text-[10px] font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-black/20 pointer-events-auto active:scale-95 transition-all">
                 Dismiss Details
              </button>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActionVisible, setIsBulkActionVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Order>('orders', (data) => {
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Order sync error:", err);
      setError("Unable to sync live orders. Please check permissions.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update selected order details if data changes
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDocument('orders', id, { status });
      toast.success(`Order #${id.slice(-4)} ${status}`);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      const loadingToast = toast.loading(`Updating ${selectedIds.length} orders...`);
      await bulkUpdateDocuments('orders', selectedIds, { status });
      toast.dismiss(loadingToast);
      toast.success(`Bulk updated ${selectedIds.length} orders to ${status}`);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Bulk update failed');
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'pending').length,
    PROVING: orders.filter(o => o.status === 'proving').length,
    OVEN: orders.filter(o => o.status === 'oven').length,
    READY: orders.filter(o => o.status === 'ready_for_collection').length,
    TRANSIT: orders.filter(o => o.status === 'out_for_delivery').length,
  };

  const filteredOrders = orders.filter(o => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = o.id.toLowerCase().includes(searchLow) || 
                         (o.address?.street || '').toLowerCase().includes(searchLow) ||
                         (o.customer?.name || '').toLowerCase().includes(searchLow) ||
                         (o.customer?.phone || '').includes(searchTerm);
    if (!matchesSearch) return false;
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return o.status === 'pending';
    if (filter === 'PROVING') return o.status === 'proving';
    if (filter === 'OVEN') return o.status === 'oven';
    if (filter === 'READY') return o.status === 'ready_for_collection';
    if (filter === 'TRANSIT') return o.status === 'out_for_delivery';
    return true;
  });

  return (
    <div className="space-y-4 pb-32 min-h-screen">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search name, phone, or order ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl px-12 py-3.5 text-sm font-medium shadow-sm focus:ring-0 outline-none"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
         {Object.entries(counts).map(([key, count]) => (
            <button 
              key={key} 
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-black tracking-widest transition-all ${
                filter === key ? 'bg-[#1D1D1F] text-white shadow-xl shadow-black/10' : 'bg-white border border-black/5 text-gray-400'
              }`}
            >
              {key} <span className="opacity-60">{count}</span>
            </button>
         ))}
      </div>

      {/* Orders List / Empty States */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-2 border-gray-100 border-t-[var(--color-admin-dark)] rounded-full animate-spin" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialising Fleet Hub</p>
          </div>
        ) : error ? (
           <div className="py-20 flex flex-col items-center gap-4 px-10 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                 <AlertCircle size={32} />
              </div>
              <h3 className="text-sm font-black text-[var(--color-admin-dark)] uppercase">Permission Rejected</h3>
              <p className="text-xs text-gray-400 font-bold leading-relaxed">{error}</p>
           </div>
        ) : filteredOrders.length === 0 ? (
           <div className="py-24 flex flex-col items-center justify-center gap-6 opacity-40">
              <Package size={64} className="text-gray-300" />
              <div className="text-center">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No active logs</p>
                 <p className="text-xs font-bold text-gray-300 mt-1">Orders matching this criteria appear here</p>
              </div>
           </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-2xl border transition-all flex overflow-hidden cursor-pointer group ${
                  selectedIds.includes(order.id) ? 'border-[var(--color-admin-dark)] ring-1 ring-[var(--color-admin-dark)]' : 'border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
              >
                {/* Multi-Select Toggle */}
                <div 
                  onClick={(e) => toggleSelect(order.id, e)}
                  className={`w-12 border-r flex items-center justify-center transition-colors ${
                    selectedIds.includes(order.id) ? 'bg-[var(--color-admin-dark)] border-[var(--color-admin-dark)]' : 'border-gray-50 bg-gray-50/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedIds.includes(order.id) ? 'bg-white border-white' : 'bg-white border-gray-200'
                  }`}>
                    {selectedIds.includes(order.id) && <Check size={14} className="text-[#1D1D1F]" />}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-300 tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                      <Badge variant={
                        order.status === 'delivered' ? 'success' : 
                        order.status === 'cancelled' ? 'error' : 
                        order.status === 'pending' ? 'info' : 'warning'
                      }>
                        {order.status.replace('_', ' ')}
                      </Badge>
                   </div>
                   
                   <div className="flex justify-between items-end">
                      <div>
                         <h3 className="text-sm font-black text-[var(--color-admin-dark)]">{order.customer?.name || `Guest #${order.userId.slice(-6)}`}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <MapPin size={10} className="text-gray-300" />
                            <p className="text-[10px] font-bold text-gray-400 tracking-tight line-clamp-1">
                               {order.address?.street}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center justify-end gap-1 mb-1">
                            <Clock size={10} className="text-gray-300" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">₹{order.total}</span>
                         </div>
                         <p className="text-[10px] font-bold text-gray-300 uppercase">{order.items.length} SKUs</p>
                      </div>
                   </div>
                </div>

                <div className="w-12 border-l border-gray-50 flex items-center justify-center group-hover:bg-gray-50/50 transition-colors">
                    <ChevronRight size={16} className="text-gray-200" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] z-[100]"
          >
             <div className="bg-[#1D1D1F] rounded-[2.5rem] shadow-2xl p-4 border border-white/10 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4 px-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-white font-black">{selectedIds.length}</div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Selections</span>
                   </div>
                   <button onClick={() => setSelectedIds([])} className="text-[10px] font-black text-white/40 uppercase hover:text-white transition-colors">Deselect All</button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   {['pending', 'proving', 'oven', 'cooling', 'ready_for_collection', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                     <button
                        key={status}
                        onClick={() => handleBulkStatusChange(status)}
                        className={`py-3 text-[8px] font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all text-center ${
                          ['delivered', 'cancelled'].includes(status) ? 'bg-black/20 text-white/70' : 'bg-white/10 text-white'
                        }`}
                     >
                        {status.replace('_', ' ')}
                     </button>
                   ))}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderDetailsModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};