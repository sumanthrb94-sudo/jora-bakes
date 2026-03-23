import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Flame,
  ShoppingBag
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['pending', 'preparing', 'out_for_delivery', 'delivered'];

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Pending',          color: 'bg-amber-50 text-amber-600 border-amber-100' },
  preparing:        { label: 'Preparing',        color: 'bg-blue-50 text-blue-600 border-blue-100' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  delivered:        { label: 'Delivered',        color: 'bg-green-50 text-green-700 border-green-100' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const meta = STATUS_META[status] || { label: status, color: 'bg-gray-50 text-gray-400 border-gray-100' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${meta.color}`}>
      {meta.label}
    </span>
  );
};

const OrderDetailsModal = ({ order, onClose, onUpdateStatus }: { order: Order | null, onClose: () => void, onUpdateStatus: (id: string, s: string) => void }) => {
  if (!order) return null;

  const getPortalTarget = () => document.getElementById('modal-root') || document.body;

  return createPortal(
    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1C1412]/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl relative z-[10000] overflow-y-auto"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
         {/* Header */}
         <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 w-full">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Order Details</p>
               <h2 className="text-2xl font-black text-[#1D1D1F] uppercase tracking-tight italic">#{order.id?.slice(-6).toUpperCase() || 'SYS'}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
               <X size={20} />
            </button>
         </div>

         {/* Content Body */}
         <div className="p-6 space-y-8 w-full block">
            {/* Customer Info */}
            <div className="space-y-4">
               <h3 className="text-base font-black text-[#1D1D1F] leading-none">Customer Info</h3>
               <p className="text-xs font-bold text-gray-400 mb-3">ID: {order.userId?.slice(-8) || 'GUEST'}</p>
               
               <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                     <Phone size={16} className="text-gray-400 shrink-0" />
                     <span className="text-sm font-bold text-gray-800 break-words">{order.customer?.phone || 'No phone provided'}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                     <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                     <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-800 break-words">{order.address?.street || 'No Address'}</span>
                        {order.address?.label && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Label: {order.address.label}</span>}
                     </div>
                  </div>
                  
                  {order.address?.instructions && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                       <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                       <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Delivery / Cook Notes</span>
                          <span className="text-sm font-bold text-amber-900 break-words whitespace-pre-wrap">{order.address.instructions}</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Itemization ({order.items?.length || 0})</h3>
               <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 block">
                       <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                             <div className="w-8 h-8 shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center font-black text-xs text-gray-800">{item.quantity || 1}x</div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-gray-800 tracking-tight break-words">{item.product?.name || 'Unknown Item'}</span>
                                {item.variant && <span className="text-[10px] font-bold text-gray-500 capitalize break-words">{item.variant.flavor} ({item.variant.weight})</span>}
                             </div>
                          </div>
                          <span className="font-black text-sm text-gray-800 shrink-0">Rs. {Number(item.product?.price || 0) * (item.quantity || 1)}</span>
                       </div>
                       
                       {item.specialRequest && (
                         <div className="mt-3 bg-amber-100/50 border border-amber-100 rounded-xl p-3 flex gap-2">
                           <Flame size={14} className="text-amber-500 shrink-0" />
                           <div className="min-w-0">
                             <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Special Request</span>
                             <span className="text-xs font-bold text-amber-900 break-words whitespace-pre-wrap">{item.specialRequest}</span>
                           </div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Status Management */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Update Status</h3>
               <div className="grid grid-cols-2 gap-2">
                  {STATUS_STEPS.map((step) => (
                    <button
                      key={step}
                      onClick={() => onUpdateStatus(order.id, step)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        order.status === step 
                          ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white shadow-md ring-1 ring-offset-1 ring-[#1D1D1F]' 
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                       <span className="text-[9px] font-black uppercase tracking-widest block">{STATUS_META[step]?.label || step.replace('_', ' ')}</span>
                       {order.status === step && <div className="w-1 h-1 bg-white rounded-full mt-0.5" />}
                    </button>
                  ))}
               </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-6 rounded-2xl space-y-4 w-full">
               <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Mode</span>
                  <span className="px-2 py-1 bg-[#1D1D1F] rounded text-[9px] font-black text-white uppercase tracking-widest">
                    {order.paymentMethod || 'CASH'}
                  </span>
               </div>
               
               <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span>Rs. {order.total}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Delivery</span>
                  <span className="text-green-600 font-black tracking-wide uppercase text-[10px]">Free</span>
               </div>
               
               <div className="border-t border-dashed border-gray-300 my-2 pt-3 flex justify-between items-center">
                  <span className="text-xs font-black text-[#1D1D1F] uppercase tracking-widest">Grand Total</span>
                  <span className="text-lg font-black text-[#1D1D1F] tracking-tighter">Rs. {order.total}</span>
               </div>
            </div>
            
            <button 
               onClick={onClose} 
               className="w-full py-4 bg-[#1D1D1F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
            >
               Dismiss Details
            </button>
         </div>
      </div>
    </div>,
    getPortalTarget()
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

      {/* â”€â”€â”€ Page Header â”€â”€â”€ */}
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

      {/* â”€â”€â”€ Search Bar â”€â”€â”€ */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search name, phone, or order IDâ€¦"
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
           const labels: Record<string, string> = { ALL: 'All', PENDING: 'Pending', PREPARING: 'Preparing', DELIVERY: 'Out for Delivery', DELIVERED: 'Delivered' };
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
