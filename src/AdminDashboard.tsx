import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { subscribeToCollection } from './services/firestore';
import { Order, Product } from './types';
import { motion } from 'framer-motion';
import { 
  Zap, 
  ShoppingBag, 
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';

const HubCard = ({ title, value, icon, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-5 rounded-[2.5rem] border border-[var(--color-admin-border)] shadow-sm flex flex-col items-start gap-4 active:scale-95 transition-all w-full text-left"
  >
    <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-xl font-black text-[var(--color-admin-dark)] tracking-tighter">{value}</p>
    </div>
  </button>
);

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubOrders = subscribeToCollection<Order>('orders', (data) => { setOrders(data); setLoading(false); });
    const unsubProducts = subscribeToCollection<Product>('products', (data) => { setProducts(data); });
    return () => { unsubOrders(); unsubProducts(); };
  }, [isAdmin]);

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
  const todayRevenue = orders
    .filter(o => o.createdAt.startsWith(new Date().toISOString().split('T')[0]))
    .reduce((sum, o) => sum + o.total, 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-[var(--color-admin-red)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-[428px] mx-auto">
      <div className="flex items-center justify-between px-1">
        <div>
           <h1 className="text-2xl font-black text-[#1C1C1C] tracking-tight">Today's Pulse</h1>
           <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Live</span>
           </div>
        </div>
        <div className="bg-[#1C1C1C] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10">
           ₹{todayRevenue}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <HubCard 
           title="Active Orders" 
           value={activeOrders.length} 
           icon={<Zap size={24} />} 
           color="bg-orange-500"
           onClick={() => navigate('/admin/orders')}
         />
         <HubCard 
           title="Products" 
           value={products.length} 
           icon={<ShoppingBag size={24} />} 
           color="bg-blue-500"
           onClick={() => navigate('/admin/products')}
         />
      </div>

      <div className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Alerts</h2>
            <span className="text-[10px] font-bold text-[var(--color-admin-red)]">View System Log</span>
         </div>
         
         <div className="space-y-3">
            {activeOrders.length > 5 && (
              <div className="bg-orange-50 p-4 rounded-3xl border border-orange-100 flex gap-3">
                 <Clock className="text-orange-500 shrink-0" size={20} />
                 <p className="text-xs font-bold text-orange-900 leading-tight">High volume detected ({activeOrders.length} orders). Consider pausing new orders if baking time exceeds 45 mins.</p>
              </div>
            )}
            
            {products.some(p => (p.stockQuantity || 0) < 5) && (
              <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex gap-3">
                 <AlertCircle className="text-red-500 shrink-0" size={20} />
                 <p className="text-xs font-bold text-red-900 leading-tight">Some items are running low on stock. Check Menu section for sync.</p>
              </div>
            )}

            <div className="bg-indigo-50 p-4 rounded-3xl border border-indigo-100 flex gap-3 items-center justify-between">
                <div className="flex gap-3">
                   <TrendingUp className="text-indigo-500 shrink-0" size={20} />
                   <p className="text-xs font-bold text-indigo-900">Revenue up 12% from yesterday.</p>
                </div>
                <ChevronRight className="text-indigo-300" size={16} />
            </div>
         </div>
      </div>

      <button 
        onClick={() => navigate('/admin/analytics')}
        className="w-full bg-[var(--color-admin-dark)] p-6 rounded-[2.5rem] text-white flex items-center justify-between group active:scale-95 transition-all shadow-xl shadow-black/10"
      >
        <div className="flex items-center gap-4">
           <div className="p-3 bg-white/10 rounded-2xl">
              <TrendingUp size={24} className="text-[var(--color-admin-red)]" />
           </div>
           <div className="text-left">
              <p className="text-sm font-black uppercase tracking-tight">Full Insights</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Operational Analytics</p>
           </div>
        </div>
        <ChevronRight size={20} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};