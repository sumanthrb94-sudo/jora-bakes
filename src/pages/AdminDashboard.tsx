import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, updateDocument, bulkUpdateDocuments, deleteDocument } from '../services/firestore';
import { Order, Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Phone, MapPin, Mail, Trash2, X, Package, CalendarDays, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['received', 'confirmed', 'baking', 'out_for_delivery', 'delivered', 'cancelled'] as const;

const STATUS_STYLE: Record<string, { dot: string; text: string; pill: string }> = {
  received:         { dot: 'bg-blue-400',   text: 'text-blue-600',   pill: 'bg-blue-50 text-blue-700 border-blue-100' },
  confirmed:        { dot: 'bg-indigo-400', text: 'text-indigo-600', pill: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  baking:           { dot: 'bg-orange-400', text: 'text-orange-600', pill: 'bg-orange-50 text-orange-700 border-orange-100' },
  out_for_delivery: { dot: 'bg-purple-400', text: 'text-purple-600', pill: 'bg-purple-50 text-purple-700 border-purple-100' },
  delivered:        { dot: 'bg-green-400',  text: 'text-green-600',  pill: 'bg-green-50 text-green-700 border-green-100' },
  cancelled:        { dot: 'bg-red-400',    text: 'text-red-500',    pill: 'bg-red-50 text-red-600 border-red-100' },
};

const fmt = (s: string) => s.replace(/_/g, ' ');

// Accordion that actually works — no framer height:auto issues
const ExpandPanel = ({ open, children }: { open: boolean; children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) setHeight(open ? ref.current.scrollHeight : 0);
  }, [open]);

  return (
    <div
      style={{ height, overflow: 'hidden', transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)' }}
    >
      <div ref={ref}>{children}</div>
    </div>
  );
};

export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const u1 = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    const u2 = subscribeToCollection<Product>('products', setProducts);
    return () => { u1(); u2(); };
  }, [isAdmin]);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const todayRevenue = orders
    .filter(o => o.createdAt?.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((s, o) => s + (o.total ?? 0), 0);

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  };

  const handleStatus = async (id: string, status: string) => {
    setBusyId(id + status);
    try {
      await updateDocument('orders', id, { status });
      toast.success(`→ ${fmt(status)}`);
    } finally { setBusyId(null); }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || !selectedIds.length) return;
    const t = toast.loading(`Updating ${selectedIds.length} orders…`);
    await bulkUpdateDocuments('orders', selectedIds, { status: bulkStatus });
    toast.dismiss(t);
    toast.success(`${selectedIds.length} → ${fmt(bulkStatus)}`);
    setSelectedIds([]); setBulkStatus('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBusyId('del-' + id);
    try {
      await deleteDocument('orders', id);
      if (expandedId === id) setExpandedId(null);
      toast.success('Order deleted');
    } finally { setBusyId(null); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-28">

      {/* ─── KPI Strip ─── */}
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

      {/* ─── Bulk Bar ─── */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}
            className="mx-4 mb-4 bg-gray-950 rounded-2xl px-4 py-3 flex items-center gap-2 shadow-lg"
          >
            <span className="text-[9px] font-black text-white/50 uppercase tracking-widest shrink-0">
              {selectedIds.length} selected
            </span>
            <select
              value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
              className="flex-1 bg-white/10 text-white text-[10px] font-bold rounded-xl px-2 py-1.5 border border-white/10 focus:outline-none appearance-none"
            >
              <option value="" className="bg-gray-900">Move to…</option>
              {STATUS_FLOW.map(s => <option key={s} value={s} className="bg-gray-900">{fmt(s)}</option>)}
            </select>
            <button
              onClick={handleBulkUpdate} disabled={!bulkStatus}
              className="bg-white text-gray-900 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl disabled:opacity-20 shrink-0"
            >Apply</button>
            <button onClick={() => { setSelectedIds([]); setBulkStatus(''); }}>
              <X size={14} className="text-white/30 hover:text-white transition-colors" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-4 mb-3">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Orders <span className="text-gray-300">· {orders.length}</span>
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

      {/* ─── Order Feed ─── */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 opacity-30">
          <Package size={40} className="text-gray-300" />
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No orders yet</span>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {orders.map((order) => {
            const isOpen = expandedId === order.id;
            const isSelected = selectedIds.includes(order.id);
            const ss = STATUS_STYLE[order.status] ?? STATUS_STYLE['received'];

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-colors ${
                  isSelected ? 'border-gray-900' : 'border-gray-100'
                }`}
              >
                {/* ── Row ── */}
                <div
                  className="flex items-start gap-3 p-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                >
                  {/* Checkbox */}
                  <div
                    onClick={e => toggleSelect(order.id, e)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-200'
                    }`}
                  >
                    {isSelected && <Check size={11} className="text-white" />}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-gray-900 truncate">
                        {order.customer?.name || `Guest`}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${ss.pill}`}>
                        {fmt(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400 font-medium">
                      <span>{order.items?.length ?? 0} items</span>
                      <span className="font-black text-gray-600">₹{order.total}</span>
                      {order.deliveryDate && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={9} />
                          {new Date(order.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.22s' }}>
                    <ChevronDown size={16} className="text-gray-300 shrink-0 mt-1" />
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                <ExpandPanel open={isOpen}>
                  <div className="border-t border-gray-50 px-4 pt-4 pb-5 space-y-5">

                    {/* Contact */}
                    <div className="space-y-2">
                      {order.customer?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} className="text-gray-300 shrink-0" />
                          <span className="text-xs font-semibold text-gray-600">{order.customer.phone}</span>
                        </div>
                      )}
                      {order.customer?.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={12} className="text-gray-300 shrink-0" />
                          <span className="text-xs font-semibold text-gray-600">{order.customer.email}</span>
                        </div>
                      )}
                      {order.address?.street && (
                        <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-gray-300 shrink-0 mt-0.5" />
                          <span className="text-xs font-semibold text-gray-600 leading-snug">{order.address.street}</span>
                        </div>
                      )}
                      {order.deliverySlot && (
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-gray-300 shrink-0" />
                          <span className="text-xs font-semibold text-gray-600">{order.deliverySlot}</span>
                        </div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2.5">
                          <div>
                            <span className="text-xs font-bold text-gray-900">
                              {item.quantity}× {item.product?.name ?? 'Item'}
                            </span>
                            {item.variant?.flavor && (
                              <p className="text-[10px] text-gray-400 capitalize">{item.variant.flavor} · {item.variant.weight}</p>
                            )}
                          </div>
                          <span className="text-xs font-black text-gray-700">
                            ₹{(item.product?.price ?? 0) * item.quantity}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between px-3 py-2.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                        <span className="text-sm font-black text-gray-900">₹{order.total}</span>
                      </div>
                    </div>

                    {/* Status Pills */}
                    <div>
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-2.5 block">Update Status</span>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_FLOW.map((s) => {
                          const isCurrent = order.status === s;
                          const key = order.id + s;
                          return (
                            <button
                              key={s}
                              onClick={() => handleStatus(order.id, s)}
                              disabled={busyId === key}
                              className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                                isCurrent
                                  ? 'bg-gray-900 text-white border-gray-900'
                                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {busyId === key
                                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                : <>{isCurrent && <Check size={9} />} {fmt(s)}</>
                              }
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="flex justify-end pt-1 border-t border-gray-50">
                      <button
                        onClick={e => handleDelete(order.id, e)}
                        disabled={busyId === 'del-' + order.id}
                        className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 pt-3"
                      >
                        {busyId === 'del-' + order.id
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={12} />
                        }
                        Remove Order
                      </button>
                    </div>
                  </div>
                </ExpandPanel>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};