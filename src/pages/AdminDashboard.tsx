import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { subscribeToCollection, updateDocument } from '../services/firestore';
import { Order, Product } from '../types';
import toast from 'react-hot-toast';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import {
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Star,
  Users,
  Plus,
  Activity,
  Zap,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' };
    case 'proving': return { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' };
    case 'oven': return { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-500' };
    case 'cooling': return { bg: 'bg-sky-50', text: 'text-sky-600', dot: 'bg-sky-400' };
    case 'ready_for_collection': return { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' };
    case 'out_for_delivery': return { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-500' };
    case 'delivered': return { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' };
    case 'cancelled': return { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-400' };
    case 'cancelled_and_refunded': return { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-400', dot: 'bg-gray-300' };
  }
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub, icon, accent, delay = 0 }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode;
  accent: string; delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.25 }}
    className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
  >
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${accent}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none mb-1">{label}</p>
      <p className="text-2xl font-black text-[#1D1D1F] tracking-tighter leading-none">{value}</p>
      {sub && <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase tracking-widest">{sub}</p>}
    </div>
  </motion.div>
);

const QuickAction = ({ label, icon, onClick, color }: {
  label: string; icon: React.ReactNode; onClick: () => void; color: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left w-full ${color}`}
  >
    {icon}
    <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
    <ArrowRight size={14} className="ml-auto opacity-40" />
  </motion.button>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubOrders = subscribeToCollection<Order>('orders', (data) => {
      const sorted = [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(sorted);
      setLoading(false);
    });
    const unsubProducts = subscribeToCollection<Product>('products', setProducts);
    return () => { unsubOrders(); unsubProducts(); };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled', 'cancelled_and_refunded'].includes(o.status));
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const lowStockProducts = products.filter(p => (p.stockQuantity || 0) < 3 && p.isAvailable);

  // Bestsellers
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.items?.forEach(i => {
    const name = i.product?.name || 'Unknown';
    itemCounts[name] = (itemCounts[name] || 0) + (i.quantity || 0);
  }));
  const bestsellers = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const recentOrders = orders.slice(0, 5);

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-gray-100 border-t-[#1D1D1F] rounded-full"
        />
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Initialising Hub</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-1.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <h1 className="text-3xl font-black text-[#1D1D1F] tracking-tighter leading-none italic">
            Command Hub.
          </h1>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
          pendingOrders.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            pendingOrders.length > 0 ? 'bg-amber-400' : 'bg-green-500'
          }`} />
          {pendingOrders.length > 0 ? `${pendingOrders.length} Pending` : 'All Clear'}
        </div>
      </div>

      {/* ── Alert Banner (if pending) ── */}
      {pendingOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/admin/orders')}
          className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-amber-100/70 transition-colors"
        >
          <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-black text-amber-800 uppercase tracking-wider leading-none mb-0.5">
              {pendingOrders.length} Order{pendingOrders.length > 1 ? 's' : ''} Awaiting Action
            </p>
            <p className="text-[10px] font-bold text-amber-500">Tap to review and process</p>
          </div>
          <ChevronRight size={16} className="text-amber-400 shrink-0" />
        </motion.div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Today's Revenue"
          value={`Rs. ${todayRevenue.toLocaleString('en-IN')}`}
          sub={`${todayOrders.length} orders today`}
          icon={<TrendingUp size={18} />}
          accent="bg-emerald-500"
          delay={0}
        />
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          sub="In production"
          icon={<Flame size={18} />}
          accent="bg-orange-500"
          delay={0.05}
        />
        <StatCard
          label="Live Products"
          value={products.filter(p => p.isAvailable).length}
          sub={`${products.length} total listed`}
          icon={<Package size={18} />}
          accent="bg-violet-500"
          delay={0.1}
        />
        <StatCard
          label="Unique Customers"
          value={new Set(orders.map(o => o.userId)).size}
          sub="All time"
          icon={<Users size={18} />}
          accent="bg-sky-500"
          delay={0.15}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">Quick Actions</h2>
        <div className="space-y-2">
          <QuickAction
            label="Manage Orders"
            icon={<ShoppingBag size={18} className="text-[#1D1D1F]" />}
            onClick={() => navigate('/admin/orders')}
            color="bg-white border-gray-100 text-[#1D1D1F] hover:border-gray-200 hover:shadow-sm"
          />
          <QuickAction
            label="Add New Product"
            icon={<Plus size={18} className="text-white" />}
            onClick={() => navigate('/admin/products')}
            color="bg-[#1D1D1F] border-[#1D1D1F] text-white"
          />
        </div>
      </div>

      {/* ── Recent Orders ── */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Recent Orders</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest hover:opacity-60 transition-opacity flex items-center gap-1"
            >
              All <ChevronRight size={12} />
            </button>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {recentOrders.map((order, idx) => {
              const sc = getStatusColor(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedOrder(order)}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/80 transition-colors ${
                    idx !== recentOrders.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 ${sc.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#1D1D1F] leading-none">
                      {order.customer?.name || `Guest #${order.userId?.slice(-4)}`}
                    </p>
                    <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${sc.text}`}>
                      {order.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#1D1D1F]">Rs. {order.total}</p>
                    <p className="text-[9px] font-bold text-gray-300">{formatTime(order.createdAt)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bestsellers ── */}
      {bestsellers.length > 0 && (
        <div>
          <h2 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-3">All-Time Bestsellers</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {bestsellers.map(([name, count], idx) => (
              <div
                key={name}
                className={`flex items-center gap-4 p-4 ${idx !== bestsellers.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-8 h-8 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
                  <Star size={14} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#1D1D1F] truncate">{name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 max-w-[80px] h-1 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / (bestsellers[0]?.[1] || 1)) * 100, 100)}%` }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 0.6 }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{count} sold</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Low Stock Alert ── */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/admin/products')}
          className="bg-red-50 border border-red-100 rounded-3xl p-5 cursor-pointer hover:bg-red-100/60 transition-colors"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-100 rounded-2xl flex items-center justify-center text-red-500">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[11px] font-black text-red-700 uppercase tracking-wider">Stock Alert</p>
              <p className="text-[10px] font-bold text-red-400">{lowStockProducts.length} Product{lowStockProducts.length > 1 ? 's' : ''} critically low</p>
            </div>
            <ChevronRight size={16} className="text-red-300 ml-auto" />
          </div>
          <div className="space-y-1">
            {lowStockProducts.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <p className="text-[11px] font-bold text-red-600 truncate">{p.name}</p>
                <span className="text-[10px] font-black text-red-500">{p.stockQuantity ?? 0} left</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── All Clear State ── */}
      {recentOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 opacity-40">
          <CheckCircle2 size={48} className="text-gray-300" />
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No orders yet</p>
            <p className="text-xs font-bold text-gray-300 mt-1">Your first order will appear here</p>
          </div>
        </div>
      )}


      {/* ── Order Details Modal ── */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusUpdate}
        onUpdatePaymentStatus={handlePaymentStatusUpdate}
      />
    </div>
  );
};