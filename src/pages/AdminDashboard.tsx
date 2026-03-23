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
    case 'pending': return { bg: 'bg-amber-50/50', text: 'text-amber-700', dot: 'bg-amber-500' };
    case 'preparing': return { bg: 'bg-[#F2E8E4]', text: 'text-[#D26E4B]', dot: 'bg-[#D26E4B]' };
    case 'out_for_delivery': return { bg: 'bg-[#EAE2F3]', text: 'text-[#8E44AD]', dot: 'bg-[#8E44AD]' };
    case 'delivered': return { bg: 'bg-[#F0F2EF]', text: 'text-[#7A8B6E]', dot: 'bg-[#7A8B6E]' };
    case 'cancelled': return { bg: 'bg-[#F9F1F0]', text: 'text-[#C17A6B]', dot: 'bg-[#C17A6B]' };
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
    className="bg-white rounded-[2.5rem] p-6 border border-[#E8E2D9] shadow-sm hover:shadow-xl hover:border-[#D4AF37]/20 transition-all duration-500 flex flex-col gap-4 relative group overflow-hidden"
  >
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gray-50/50 rounded-full blur-2xl group-hover:bg-[#D4AF37]/5 transition-colors" />
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${accent} relative z-10`}>
      {icon}
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.2em] leading-none mb-2">{label}</p>
      <p className="text-3xl font-black text-[#1C1412] tracking-tighter leading-none italic">{value}</p>
      {sub && <p className="text-[9px] font-bold text-[#D26E4B] mt-2 uppercase tracking-widest">{sub}</p>}
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
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-10 h-10 border-4 border-[#E8E2D9] border-t-[#D26E4B] rounded-full shadow-lg"
        />
        <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Jora Data Stream</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* ── Header ── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] leading-none mb-2 italic">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
          <h1 className="text-4xl font-black text-[#1C1412] tracking-tighter leading-none italic uppercase">
            Hub.
          </h1>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all duration-500 ${
          pendingOrders.length > 0 
            ? 'bg-amber-50/50 text-amber-700 border-amber-100 shadow-amber-500/10' 
            : 'bg-[#F0F2EF] text-[#7A8B6E] border-[#E8E2D9] shadow-green-500/5'
        }`}>
          <div className={`w-2 h-2 rounded-full shadow-sm ${
            pendingOrders.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-[#7A8B6E]'
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
          icon={<TrendingUp size={22} />}
          accent="bg-[#7A8B6E]" // Sage accent
          delay={0}
        />
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          sub="In production"
          icon={<Flame size={22} />}
          accent="bg-[#D26E4B]" // Terracotta accent
          delay={0.05}
        />
        <StatCard
          label="Live Products"
          value={products.filter(p => p.isAvailable).length}
          sub={`${products.length} total listed`}
          icon={<Package size={22} />}
          accent="bg-[#D4AF37]" // Gold accent
          delay={0.1}
        />
        <StatCard
          label="Unique Customers"
          value={new Set(orders.map(o => o.userId)).size}
          sub="All time"
          icon={<Users size={22} />}
          accent="bg-[#1C1412]" // Cacao accent
          delay={0.15}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-4 italic">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3">
          <QuickAction
            label="Manage Orders"
            icon={<ShoppingBag size={18} className="text-[#1C1412]" />}
            onClick={() => navigate('/admin/orders')}
            color="bg-white border-[#E8E2D9] text-[#1C1412] hover:border-[#D26E4B]/50 hover:shadow-xl hover:shadow-[#D26E4B]/5 transition-all duration-500"
          />
          <QuickAction
            label="Add New Product"
            icon={<Plus size={18} className="text-white" />}
            onClick={() => navigate('/admin/products')}
            color="bg-[#D26E4B] border-[#B85A3A] text-white shadow-lg shadow-[#D26E4B]/20 active:scale-95 transition-all duration-300"
          />
        </div>
      </div>

      {/* ── Recent Orders ── */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Live Stream</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="px-4 py-1.5 bg-white border border-[#E8E2D9] text-[10px] font-black text-[#D26E4B] uppercase tracking-[0.2em] rounded-full shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              All Activity
            </button>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-[#E8E2D9] shadow-sm overflow-hidden divide-y divide-[#F5F0E8]">
            {recentOrders.map((order, idx) => {
              const sc = getStatusColor(order.status);
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#FAF7F2]/50 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 ${sc.bg} border-white shadow-sm`}>
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${sc.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-black text-[#1C1412] leading-none uppercase italic tracking-tight">
                      {order.customer?.name || `Guest #${order.userId?.slice(-4)}`}
                    </p>
                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 block ${sc.text}`}>
                      {order.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#1C1412] italic">Rs. {order.total}</p>
                    <p className="text-[9px] font-bold text-[#8B8680] mt-1.5 uppercase tracking-widest">{formatTime(order.createdAt)}</p>
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
          <h2 className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-4 italic">Bestsellers</h2>
          <div className="bg-white rounded-[2.5rem] border border-[#E8E2D9] shadow-sm overflow-hidden divide-y divide-[#F5F0E8]">
            {bestsellers.map(([name, count], idx) => (
              <div
                key={name}
                className="flex items-center gap-4 p-5 animate-in fade-in slide-in-from-left-4 transition-all duration-500"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="w-10 h-10 bg-[#FFF9F5] border border-[#E8E2D9] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                  <Star size={18} className="text-[#D4AF37]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black text-[#1C1412] uppercase italic tracking-tight truncate">{name}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 max-w-[120px] h-1.5 bg-[#F5F0E8] rounded-full overflow-hidden border border-white/50">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / (bestsellers[0]?.[1] || 1)) * 100, 100)}%` }}
                        transition={{ delay: 0.3 + idx * 0.1, duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D26E4B] rounded-full"
                      />
                    </div>
                    <span className="text-[9px] font-black text-[#B85A3A] uppercase tracking-[0.2em]">{count} units sold</span>
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/admin/products')}
          className="bg-[#F9F1F0] border border-[#E8E2D9] rounded-[2.5rem] p-6 cursor-pointer hover:shadow-xl hover:shadow-[#C17A6B]/5 transition-all duration-500 group overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#C17A6B]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#C17A6B]/10 transition-colors" />
          
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-12 h-12 bg-white border border-[#E8E2D9] rounded-2xl flex items-center justify-center text-[#C17A6B] shadow-sm group-hover:scale-110 transition-transform duration-500">
              <Zap size={22} fill="currentColor" />
            </div>
            <div>
              <p className="text-[11px] font-black text-[#C17A6B] uppercase tracking-[0.2em] italic">Critical Alert</p>
              <p className="text-[10px] font-bold text-[#8B8680] mt-1">{lowStockProducts.length} Product{lowStockProducts.length > 1 ? 's' : ''} require action</p>
            </div>
            <ArrowRight size={18} className="text-[#C17A6B] ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-2 relative z-10">
            {lowStockProducts.slice(0, 3).map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white/40 p-3 rounded-2xl border border-[#E8E2D9]/50">
                <p className="text-[11px] font-black text-[#1C1412] uppercase italic tracking-tight truncate">{p.name}</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C17A6B] animate-pulse" />
                  <span className="text-[10px] font-black text-[#C17A6B] uppercase tracking-widest">{p.stockQuantity ?? 0} Left</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── All Clear State ── */}
      {recentOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
          <CheckCircle2 size={48} className="text-[#D26E4B] opacity-20" />
          <div className="text-center">
            <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">No active logs</p>
            <p className="text-xs font-bold text-[#8B8680] mt-1 italic">New orders will manifest here</p>
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