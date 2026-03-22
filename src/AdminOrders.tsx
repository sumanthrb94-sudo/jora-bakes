import React, { useState, useEffect } from 'react';
import { subscribeToCollection, updateDocument } from './services/firestore';
import { Order } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star,
  ChevronRight,
  X,
  Phone,
  MapPin,
  Clock as ClockIcon,
  CheckCircle2,
  Package,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['received', 'confirmed', 'baking', 'out_for_delivery', 'delivered', 'cancelled'];

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'success' | 'info' | 'default' | 'error' }) => {
  const styles = {
    success: 'bg-[#E6F4EA] text-[#1E8E3E]',
    info: 'bg-[#E8F0FE] text-[#1967D2]',
    error: 'bg-[#FCE8E6] text-[#D93025]',
    default: 'bg-gray-100 text-gray-600'
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
                 <h2 className="text-2xl font-black text-[var(--color-admin-dark)] uppercase tracking-tight">#{order.id.slice(-6).toUpperCase()}</h2>
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
                            ? 'bg-[var(--color-admin-dark)] border-[var(--color-admin-dark)] text-white shadow-xl shadow-black/10' 
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<Order>('orders', (data) => {
      const sorted = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
      if (selectedOrder) {
         const updated = sorted.find(o => o.id === selectedOrder.id);
         if (updated) setSelectedOrder(updated);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedOrder]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDocument('orders', id, { status });
      toast.success(`Order status updated to ${status.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const counts = {
    ALL: orders.length,
    PENDING: orders.filter(o => o.status === 'received').length,
    PREPARING: orders.filter(o => o.status === 'baking').length,
    OUT_FOR_DELIVERY: orders.filter(o => o.status === 'out_for_delivery').length,
    DELIVERED: orders.filter(o => o.status === 'delivered').length,
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (o.address?.street || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (o.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'ALL') return true;
    if (filter === 'PENDING') return o.status === 'received';
    if (filter === 'PREPARING') return o.status === 'baking';
    if (filter === 'OUT_FOR_DELIVERY') return o.status === 'out_for_delivery';
    if (filter === 'DELIVERED') return o.status === 'delivered';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search address, name, or order ID..." 
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
                filter === key ? 'bg-[var(--color-admin-dark)] text-white' : 'bg-white border border-gray-50 text-gray-400'
              }`}
            >
              {key} <span className="opacity-60">{count}</span>
            </button>
         ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" /></div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <motion.div 
                layout 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                key={order.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden cursor-pointer hover:border-gray-200 transition-all"
              >
                <div className="p-4 flex-1 flex flex-col gap-3">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-300">#{(order.id || '').toUpperCase().slice(-4)}</span>
                      <Badge variant={order.status === 'delivered' ? 'success' : 'info'}>{order.status}</Badge>
                      <Badge variant="success">PAID</Badge>
                   </div>
                   
                   <div>
                      <h3 className="text-sm font-bold text-[var(--color-admin-dark)]">{order.customer?.name || `Customer #${order.userId.slice(-6)}`}</h3>
                      <p className="text-[10px] font-bold text-gray-400 tracking-tight line-clamp-1">
                         {order.address?.street} • {order.items.length} items • ₹{order.total}
                      </p>
                   </div>
                </div>

                <div className="w-20 border-l border-gray-50 flex flex-col items-center justify-center bg-gray-50/20">
                    <ChevronRight size={16} className="text-gray-300" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <OrderDetailsModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};