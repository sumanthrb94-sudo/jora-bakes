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
  out_for_delivery: 'bg-[#FEF7E0] text-[#B06000]', // Yellowish for in-progress
  delivered:        'bg-[#E6F4EA] text-[#1E8E3E]',
  cancelled:        'bg-[#FCE8E6] text-[#D93025]',
};

const CATEGORIES = ['All', 'Cakes', 'Brownies', 'Cupcakes', 'Cookies', 'Savories', 'Others'];

const fmt = (s: string) => s.replace(/_/g, ' ');

// ─── Order Detail Drawer (Bulletproof CSS) ──────────────────────────────────
const OrderDetailDrawer = ({
  order,
  onClose,
  onStatusUpdate,
  onDelete,
}: {
  order: Order;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) => {
  const [pendingStatus, setPendingStatus] = useState(order.status);
  const [riderName, setRiderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setPendingStatus(order.status); }, [order.status]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = { status: pendingStatus };
      if (riderName.trim()) updates.riderName = riderName.trim();
      await updateDocument('orders', order.id, updates);
      toast.success('Order updated');
      onClose();
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this order permanently?')) return;
    setDeleting(true);
    try {
      await onDelete(order.id);
      onClose();
    } finally { setDeleting(false); }
  };

  const phone = order.customer?.phone?.replace(/\D/g, '');
  const waPhone = phone?.startsWith('91') ? phone : `91${phone}`;
  const waText = encodeURIComponent(
    `Hi ${order.customer?.name || 'there'}, your Jora Bakes order #${order.id.slice(-6).toUpperCase()} is now *${STATUS_LABELS[pendingStatus]}*. Thank you! 🍰`
  );
  const waLink = phone ? `https://wa.me/${waPhone}?text=${waText}` : null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet — Rock solid centering for mobile-first app width */}
        <motion.div
          key="sheet"
          initial={{ y: '100%', translateX: '-50%' }} 
          animate={{ y: 0, translateX: '-50%' }} 
          exit={{ y: '100%', translateX: '-50%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 250 }}
          style={{ 
            left: '50%',
            width: '100%',
            maxWidth: '428px'
          }}
          className="fixed bottom-0 bg-white rounded-t-[2.5rem] overflow-hidden flex flex-col max-h-[92dvh] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-7 pb-4 shrink-0">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Order Details</p>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">
                  #{order.id.slice(-6).toUpperCase()}
                </h2>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${STATUS_STYLE[order.status] ?? ''}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
              <X size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 pb-40 space-y-7">
            
            {/* Customer Section */}
            <div className="bg-[#F8F9FA] rounded-[2rem] p-6 space-y-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-gray-300 border border-gray-100 shadow-sm">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 leading-none">{order.customer?.name || 'Guest'}</p>
                    <p className="text-[11px] text-gray-400 font-bold mt-1.5 uppercase tracking-wider">{order.customer?.email || 'No email'}</p>
                  </div>
                </div>
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-lg shadow-green-500/20 active:scale-95 transition-all">
                    <MessageCircle size={14} /> CHAT
                  </a>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-start gap-3 text-gray-600">
                <MapPin size={16} className="text-gray-300 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold leading-relaxed">{order.address?.street}</p>
                  {order.address?.instructions && <p className="text-[10px] text-gray-400 mt-1 italic italic">"{order.address.instructions}"</p>}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <Phone size={16} className="text-gray-300 shrink-0" />
                <a href={`tel:${order.customer?.phone}`} className="text-sm font-black text-gray-700">{order.customer?.phone}</a>
              </div>
            </div>

            {/* Items */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-3 ml-1">Order Items</p>
              <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden divide-y divide-gray-50 shadow-sm">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-[11px] font-black text-gray-900 border border-gray-100">
                      x{item.quantity}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-900 tracking-tight">{item.product?.name}</p>
                      {item.variant && <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">{item.variant.flavor} / {item.variant.weight}</p>}
                    </div>
                    <p className="text-xs font-black text-gray-900">₹{(item.product?.price ?? 0) * item.quantity}</p>
                  </div>
                ))}
                <div className="flex justify-between px-5 py-4 bg-gray-50/50">
                  <span className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Bill</span>
                  <span className="text-base font-black text-gray-900">₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Status Update Grid */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 ml-1">Update Status</p>
              <div className="grid grid-cols-2 gap-3">
                {STATUS_FLOW.map(s => (
                  <button
                    key={s}
                    onClick={() => setPendingStatus(s)}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${
                      pendingStatus === s 
                        ? 'bg-gray-950 text-white border-gray-950 shadow-xl' 
                        : 'bg-white text-gray-400 border-gray-100'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Logistics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2.5 ml-1">Delivery Slot</p>
                <div className="bg-[#F8F9FA] rounded-[1.5rem] p-4 text-xs font-black text-gray-700 tracking-tight">
                  {order.deliverySlot || 'Standard Delivery'}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2.5 ml-1">Assign Rider</p>
                <input
                  placeholder="Rider Name"
                  value={riderName}
                  onChange={e => setRiderName(e.target.value)}
                  className="w-full bg-[#F8F9FA] border-2 border-transparent rounded-[1.5rem] p-4 text-xs font-black text-gray-900 focus:outline-none focus:border-gray-950 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300 hover:text-red-500 transition-colors"
              >
                {deleting ? <div className="w-4 h-4 border-2 border-t-transparent border-red-500 rounded-full animate-spin" /> : <Trash2 size={14} />}
                Remove Order
              </button>
            </div>
          </div>

          {/* Footer Save CTA */}
          <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-10">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-950 text-white py-5 rounded-[1.75rem] text-sm font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-2xl shadow-gray-900/30 disabled:opacity-50"
            >
              {saving ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" /> : <>Save Changes <Check size={20} /></>}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

// ─── Main Admin Dashboard ───────────────────────────────────────────────────
export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  
  // Filtering states
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

  // Sync selected order if raw data changes
  useEffect(() => {
    if (selectedOrder) {
      const live = orders.find(o => o.id === selectedOrder.id);
      if (live) setSelectedOrder(live);
    }
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchCat = categoryFilter === 'All' || o.items?.some(i => i.product?.category === categoryFilter);
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchCat && matchStatus;
    });
  }, [orders, categoryFilter, statusFilter]);

  const activeOrdersCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const todayRevenue = orders
    .filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, o) => s + (o.total || 0), 0);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !selectedIds.length) return;
    const t = toast.loading(`Updating ${selectedIds.length} orders...`);
    await bulkUpdateDocuments('orders', selectedIds, { status: bulkStatus });
    toast.dismiss(t);
    toast.success(`${selectedIds.length} orders → ${STATUS_LABELS[bulkStatus]}`);
    setSelectedIds([]); setBulkStatus('');
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await updateDocument('orders', id, { status });
    toast.success(`Updated to ${STATUS_LABELS[status]}`);
  };

  const handleDelete = async (id: string) => {
    await deleteDocument('orders', id);
    toast.success('Order deleted');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-6 h-6 border-2 border-t-transparent border-gray-950 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      
      {/* ── KPI Grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 bg-white border-b border-gray-100 shadow-sm mb-6">
        {[
          { label: 'Today ₹', value: todayRevenue.toLocaleString('en-IN') },
          { label: 'Pending', value: activeOrdersCount },
          { label: 'Live Menu', value: products.length },
        ].map((kpi, idx) => (
          <div key={idx} className={`py-6 flex flex-col items-center ${idx < 2 ? 'border-r border-gray-50' : ''}`}>
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-1">{kpi.label}</span>
            <span className="text-xl font-black text-gray-900 tabular-nums tracking-tighter">{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Engine ───────────────────────────────────────────────────── */}
      <div className="px-5 mb-6 space-y-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          <div className="p-2 bg-gray-950 rounded-xl text-white shrink-0"><Filter size={14} /></div>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategoryFilter(cat); setSelectedIds([]); }}
              className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                categoryFilter === cat ? 'bg-gray-950 text-white border-gray-950 shadow-lg' : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['All', ...STATUS_FLOW].map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setSelectedIds([]); }}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] transition-all border-2 ${
                statusFilter === status ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100'
              }`}
            >
              {status === 'All' ? 'All Workflow' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bulk Command Bar ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: -20, opacity: 0 }}
            className="mx-5 mb-6 bg-gray-950 rounded-[2rem] p-4 flex items-center gap-3 shadow-2xl shadow-gray-900/40"
          >
            <div className="flex flex-col shrink-0 px-2">
              <span className="text-[11px] font-black text-white leading-none uppercase tracking-widest">{selectedIds.length} Items</span>
              <span className="text-[8px] font-bold text-gray-500 uppercase mt-1">Targeted</span>
            </div>
            
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="flex-1 bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl px-4 py-3 border border-white/10 focus:outline-none appearance-none"
            >
              <option value="" className="bg-gray-950">Bulk Move To...</option>
              {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-gray-950">{STATUS_LABELS[s]}</option>)}
            </select>
            
            <button
              onClick={handleBulkUpdate}
              disabled={!bulkStatus}
              className="bg-white text-gray-950 text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-2xl disabled:opacity-30 active:scale-95 transition-all shadow-lg"
            >
              Apply
            </button>
            <button onClick={() => setSelectedIds([])} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Feed Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Live Stream / {filteredOrders.length}</p>
        </div>
        {filteredOrders.length > 0 && (
          <button
            onClick={handleSelectAll}
            className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-2 transition-all ${
              selectedIds.length === filteredOrders.length ? 'bg-gray-950 text-white border-gray-950' : 'bg-white text-gray-400 border-gray-100'
            }`}
          >
            {selectedIds.length === filteredOrders.length ? 'Deselect Items' : 'Select Visible'}
          </button>
        )}
      </div>

      {/* ── Order Tiles (As requested in HTML snippet) ────────────────────────── */}
      <div className="space-y-3 px-5">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 opacity-30 text-center grayscale">
            <Package size={40} className="text-gray-400" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">No Data in this Filter</p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isSelected = selectedIds.includes(order.id);
            const ss = STATUS_STYLE[order.status] ?? STATUS_STYLE['received'];
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-2xl border transition-all flex overflow-hidden cursor-pointer group ${
                  isSelected ? 'border-gray-950 ring-1 ring-gray-950 bg-gray-50/30' : 'border-gray-100'
                } hover:border-gray-200 shadow-sm`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Left Action Area */}
                <div 
                  className={`w-12 border-r flex items-center justify-center transition-colors ${
                    isSelected ? 'border-gray-950 bg-gray-950 text-white' : 'border-gray-50 bg-gray-50/10'
                  }`}
                  onClick={e => toggleSelect(order.id, e)}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-white border-white text-gray-950' : 'bg-white border-gray-200'
                  }`}>
                    {isSelected && <Check size={12} strokeWidth={4} />}
                  </div>
                </div>

                {/* Central Content (Matches Snippet) */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-300 tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${ss}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-sm font-black text-gray-950 tracking-tight">{order.customer?.name || 'Guest User'}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin size={10} className="text-gray-300" />
                        <p className="text-[10px] font-bold text-gray-400 tracking-tight line-clamp-1 max-w-[140px]">
                          {order.address?.street}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-1">
                         <Clock size={10} className="text-gray-300" />
                         <span className="text-[10px] font-black text-gray-950 tabular-nums">₹{order.total}</span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{order.items?.length || 0} SKUs</p>
                    </div>
                  </div>
                </div>

                {/* Right Navigation */}
                <div className="w-12 border-l border-gray-50 flex items-center justify-center group-hover:bg-gray-50/50 transition-colors">
                  <ChevronRight size={16} className="text-gray-200 group-hover:text-gray-950 transition-colors" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detail Drawer */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};