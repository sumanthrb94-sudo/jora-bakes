import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, updateDocument, bulkUpdateDocuments, deleteDocument } from '../services/firestore';
import { Order, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, User, MapPin, Phone, X, Package, MessageCircle, Trash2 } from 'lucide-react';
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
  received:         'bg-blue-50 text-blue-700 border-blue-100',
  confirmed:        'bg-indigo-50 text-indigo-700 border-indigo-100',
  baking:           'bg-orange-50 text-orange-700 border-orange-100',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-100',
  delivered:        'bg-green-50 text-green-700 border-green-100',
  cancelled:        'bg-red-50 text-red-600 border-red-100',
};

const fmt = (s: string) => s.replace(/_/g, ' ');

// ─── Order Detail Drawer (matches reference design) ─────────────────────────
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

  // Sync if order updates live
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
    setDeleting(true);
    try {
      await onDelete(order.id);
      onClose();
    } finally { setDeleting(false); }
  };

  const phone = order.customer?.phone?.replace(/\D/g, '');
  const waPhone = phone?.startsWith('91') ? phone : `91${phone}`;
  const waText = encodeURIComponent(
    `Hi ${order.customer?.name || 'there'}, your Jora Bakes order #${order.id.slice(-6).toUpperCase()} (₹${order.total}) is now *${STATUS_LABELS[pendingStatus]}*. Thank you! 🍰`
  );
  const waLink = phone ? `https://wa.me/${waPhone}?text=${waText}` : null;

  return createPortal(
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet — anchored directly to bottom, no flex parent */}
      <motion.div
        key="sheet"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
        className="fixed bottom-0 left-0 right-0 z-[301] bg-white rounded-t-[2rem] overflow-hidden flex flex-col max-h-[92dvh]"
      >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-0.5">Order Details</p>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-gray-900 tracking-tighter">
                  #{order.id.slice(-6).toUpperCase()}
                </h2>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_STYLE[order.status] ?? ''}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-36 space-y-5">

            {/* Customer card */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{order.customer?.name || 'Guest'}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{order.customer?.email || 'No email'}</p>
                  </div>
                </div>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 bg-[#25D366] text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl shadow-sm shadow-green-500/20 hover:bg-[#20bc5a] transition-colors"
                  >
                    <MessageCircle size={13} />
                    Chat
                  </a>
                )}
              </div>

              {order.address && (
                <div className="flex items-start gap-2 pt-1 border-t border-gray-100">
                  <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    {order.address.label && (
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{order.address.label}</p>
                    )}
                    <p className="text-xs font-semibold text-gray-700 leading-snug">{order.address.street}</p>
                    {order.address.instructions && (
                      <p className="text-[10px] text-gray-400 mt-0.5">{order.address.instructions}</p>
                    )}
                  </div>
                </div>
              )}

              {order.customer?.phone && (
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <Phone size={13} className="text-gray-400 shrink-0" />
                  <a href={`tel:${order.customer.phone}`} className="text-sm font-bold text-gray-700">
                    {order.customer.phone}
                  </a>
                </div>
              )}
            </div>

            {/* Order items */}
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">Order Items</p>
              <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-100">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-600 shrink-0">
                      x{item.quantity}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-900">{item.product?.name ?? 'Item'}</p>
                      {item.variant?.flavor && (
                        <p className="text-[10px] text-gray-400 capitalize">{item.variant.flavor} · {item.variant.weight}</p>
                      )}
                    </div>
                    <span className="text-xs font-black text-gray-900">₹{(item.product?.price ?? 0) * item.quantity}</span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 bg-gray-50">
                  <span className="text-sm font-black text-gray-900">Total</span>
                  <span className="text-sm font-black text-gray-900">₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Status grid */}
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_FLOW.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPendingStatus(s)}
                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      pendingStatus === s
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery slot + Rider */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">Delivery Slot</p>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3.5 text-xs font-semibold text-gray-700">
                  {order.deliverySlot || 'As soon as possible'}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.25em] mb-2">Assign Rider</p>
                <input
                  value={riderName}
                  onChange={e => setRiderName(e.target.value)}
                  placeholder="Rider Name"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-3 py-3.5 text-xs font-semibold text-gray-700 focus:outline-none focus:border-gray-300 transition-colors"
                />
              </div>
            </div>

            {/* Danger zone */}
            <div className="flex justify-center pt-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                {deleting
                  ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                  : <Trash2 size={12} />
                }
                Remove Order
              </button>
            </div>
          </div>

          {/* ── Save CTA ── */}
          <div className="absolute bottom-0 inset-x-0 px-5 pb-8 pt-4 bg-gradient-to-t from-white via-white to-transparent">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Save Changes'
              }
            </button>
          </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// ─── Accordion helper ─────────────────────────────────────────────────────────
const ExpandPanel = ({ open, children }: { open: boolean; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useEffect(() => {
    if (ref.current) setHeight(open ? ref.current.scrollHeight : 0);
  }, [open]);
  return (
    <div style={{ height, overflow: 'hidden', transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
      <div ref={ref}>{children}</div>
    </div>
  );
};

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    const u1 = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    const u2 = subscribeToCollection<Product>('products', setProducts);
    return () => { u1(); u2(); };
  }, [isAdmin]);

  // Keep selected order in sync with live data
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders]);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const todayRevenue = orders
    .filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, o) => s + (o.total ?? 0), 0);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !selectedIds.length) return;
    const t = toast.loading(`Updating ${selectedIds.length} orders…`);
    await bulkUpdateDocuments('orders', selectedIds, { status: bulkStatus });
    toast.dismiss(t);
    toast.success(`${selectedIds.length} → ${STATUS_LABELS[bulkStatus]}`);
    setSelectedIds([]); setBulkStatus('');
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    await updateDocument('orders', id, { status });
    toast.success(`→ ${STATUS_LABELS[status]}`);
  };

  const handleDelete = async (id: string) => {
    await deleteDocument('orders', id);
    toast.success('Order deleted');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">

      {/* KPI Strip */}
      <div className="grid grid-cols-3 bg-white border-b border-gray-100 mb-5">
        {[
          { l: 'Today ₹', v: todayRevenue.toLocaleString('en-IN') },
          { l: 'Active', v: activeOrders.length },
          { l: 'Menu', v: products.length },
        ].map((s, i) => (
          <div key={i} className={`py-5 flex flex-col items-center ${i < 2 ? 'border-r border-gray-100' : ''}`}>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-[0.25em] mb-1">{s.l}</span>
            <span className="text-xl font-black text-gray-900 tabular-nums">{s.v}</span>
          </div>
        ))}
      </div>

      {/* Bulk Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
            className="mx-4 mb-4 bg-gray-950 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg"
          >
            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest shrink-0">{selectedIds.length} selected</span>
            <select
              value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="flex-1 bg-white/10 text-white text-[10px] font-bold rounded-xl px-2 py-1.5 border border-white/10 focus:outline-none appearance-none"
            >
              <option value="" className="bg-gray-900">Move to…</option>
              {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-gray-900">{STATUS_LABELS[s]}</option>)}
            </select>
            <button onClick={handleBulkUpdate} disabled={!bulkStatus}
              className="bg-white text-gray-900 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl disabled:opacity-20 shrink-0">
              Apply
            </button>
            <button onClick={() => { setSelectedIds([]); setBulkStatus(''); }}>
              <X size={14} className="text-white/30 hover:text-white transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Orders · <span className="text-gray-300">{orders.length}</span>
        </span>
        {orders.length > 0 && (
          <button
            onClick={() => setSelectedIds(selectedIds.length === orders.length ? [] : orders.map(o => o.id))}
            className="text-[9px] font-black text-gray-300 hover:text-gray-900 uppercase tracking-widest transition-colors"
          >
            {selectedIds.length === orders.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <Package size={40} className="text-gray-300" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No orders yet</span>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {orders.map((order) => {
            const isSelected = selectedIds.includes(order.id);
            const ss = STATUS_STYLE[order.status] ?? STATUS_STYLE['received'];

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border cursor-pointer transition-colors active:bg-gray-50 ${
                  isSelected ? 'border-gray-900' : 'border-gray-100'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Checkbox */}
                  <div
                    onClick={e => toggleSelect(order.id, e)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-200'
                    }`}
                  >
                    {isSelected && <Check size={11} className="text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-black text-gray-900">{order.customer?.name || 'Guest'}</span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${ss}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">
                      {order.items?.length ?? 0} items · <span className="font-black text-gray-600">₹{order.total}</span>
                    </p>
                  </div>
                  <ChevronDown size={15} className="text-gray-300 shrink-0 -rotate-90" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Drawer */}
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