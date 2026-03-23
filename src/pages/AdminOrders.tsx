import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { subscribeToCollection, updateDocument, bulkUpdateDocuments, deleteDocument } from '../services/firestore';
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
  Flame,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

import { OrderDetailsModal, STATUS_META, STATUS_STEPS, StatusBadge } from '../components/OrderDetailsModal';

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

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateDocument('orders', orderId, { status: newStatus });
      toast.success(`Order #${orderId.slice(-6)} updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handlePaymentStatusUpdate = async (orderId: string, pStatus: 'pending' | 'paid' | 'failed') => {
    try {
      await updateDocument('orders', orderId, { paymentStatus: pStatus });
      toast.success(`Payment status updated to ${pStatus}`);
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  const handleBulkDeleteOrders = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} orders?`)) return;
    try {
      const loadingToast = toast.loading(`Deleting ${selectedIds.length} orders...`);
      await Promise.all(selectedIds.map(id => deleteDocument('orders', id)));
      toast.dismiss(loadingToast);
      toast.success(`Successfully deleted ${selectedIds.length} orders`);
      setSelectedIds([]);
      setSelectedOrder(null);
    } catch (err) {
      toast.error('Bulk delete failed');
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
    ALL:      orders.length,
    PENDING:  orders.filter(o => o.status === 'pending').length,
    PREPARING: orders.filter(o => o.status === 'preparing').length,
    DELIVERY: orders.filter(o => o.status === 'out_for_delivery').length,
    DELIVERED: orders.filter(o => o.status === 'delivered').length,
  };

  const filteredOrders = orders.filter(o => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = o.id.toLowerCase().includes(searchLow) ||
                         (o.address?.street || '').toLowerCase().includes(searchLow) ||
                         (o.customer?.name || '').toLowerCase().includes(searchLow) ||
                         (o.customer?.phone || '').includes(searchTerm);
    if (!matchesSearch) return false;
    if (filter === 'ALL') return true;
    if (filter === 'PENDING')   return o.status === 'pending';
    if (filter === 'PREPARING') return o.status === 'preparing';
    if (filter === 'DELIVERY')  return o.status === 'out_for_delivery';
    if (filter === 'DELIVERED') return o.status === 'delivered';
    return true;
  });

  return (
    <div className="space-y-5 pb-32 min-h-screen">

      {/* --- Page Header --- */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-1.5">Order Management</p>
          <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter leading-none italic">Orders.</h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#1D1D1F] tracking-tighter">{orders.length}</p>
          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Total All Time</p>
        </div>
      </div>

      {/* --- Search Bar --- */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search name, phone, or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-2xl px-12 py-4 text-sm font-medium shadow-sm focus:ring-0 outline-none focus:border-gray-200 transition-colors"
        />
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
      </div>

      {/* Filter Pills */}
      {/* Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
         {Object.entries(counts).map(([key, count]) => {
           const labels: Record<string, string> = { ALL: 'All', PENDING: 'Pending', PREPARING: 'Order Confirmed', DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered' };
           return (
             <button
               key={key}
               onClick={() => setFilter(key)}
               className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-black tracking-widest transition-all ${
                 filter === key ? 'bg-[#1D1D1F] text-white shadow-xl shadow-black/10' : 'bg-white border border-black/5 text-gray-400'
               }`}
             >
               {labels[key] || key} <span className="opacity-60">{count}</span>
             </button>
           );
         })}
      </div>

      {/* Orders List / Empty States */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="flex items-center justify-between px-1 mb-1 mt-4">
          <button
            onClick={() => {
              if (selectedIds.length === filteredOrders.length) {
                setSelectedIds([]);
              } else {
                setSelectedIds(filteredOrders.map(o => o.id));
              }
            }}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1D1D1F] hover:opacity-70 transition-opacity"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
              selectedIds.length === filteredOrders.length && filteredOrders.length > 0
                ? 'bg-[#1D1D1F] border-[#1D1D1F]'
                : 'bg-white border-gray-300'
            }`}>
              {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 && <Check size={10} className="text-white" />}
            </div>
            {selectedIds.length === filteredOrders.length && filteredOrders.length > 0 ? 'Deselect All' : 'Select All'}
          </button>

          {selectedIds.length > 0 && (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {selectedIds.length} Selected
            </span>
          )}
        </div>
      )}
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

                <div className="p-4 flex-1 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black text-gray-300 tracking-widest">#{ order.id.slice(-6).toUpperCase()}</span>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-[#1D1D1F] leading-none truncate">
                        {order.customer?.name || `Guest #${order.userId.slice(-6)}`}
                      </h3>
                      {order.address?.street && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin size={9} className="text-gray-300 shrink-0" />
                          <p className="text-[10px] font-bold text-gray-400 line-clamp-1">{order.address.street}</p>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-black text-[#1D1D1F]">Rs. {order.total}</p>
                    <p className="text-[9px] font-bold text-gray-300">{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
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
                    {STATUS_STEPS.map((status) => {
                      const meta = STATUS_META[status];
                      return (
                        <button
                          key={status}
                          onClick={() => handleBulkStatusChange(status)}
                          className={`py-3 text-[9px] font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all text-center ${
                            status === 'delivered' ? 'bg-black/20 text-white/70' : 'bg-white/10 text-white'
                          }`}
                        >
                          {meta?.label || status}
                        </button>
                      );
                    })}
                 </div>
                 <button
                    onClick={handleBulkDeleteOrders}
                    className="w-full mt-2 py-3 text-[9px] font-black uppercase tracking-widest rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-center flex items-center justify-center gap-2"
                 >
                    <AlertCircle size={14} /> Delete Selected
                 </button>
              </div>
           </motion.div>
         )}
       </AnimatePresence>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusUpdate}
        onUpdatePaymentStatus={handlePaymentStatusUpdate}
      />
    </div>
  );
};
