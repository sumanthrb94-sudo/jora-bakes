import React, { useState, useEffect } from 'react';
import { subscribeToCollection } from '../services/firestore';
import { Order, Product } from '../types';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  Zap,
  ChevronRight
} from 'lucide-react';

const MetricCard = ({ title, value, detail, trend, icon, color }: any) => (
  <div className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between h-36">
    <div className="flex justify-between items-start">
      <div className={`p-2.5 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center text-[10px] font-black ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {detail}
        </span>
      )}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 leading-none">{title}</p>
      <p className="text-2xl font-black text-[var(--color-admin-dark)] tracking-tighter">{value}</p>
    </div>
  </div>
);

export const AdminAnalytics = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data);
      setLoading(false);
    });
    const unsubProducts = subscribeToCollection<Product>('products', (data) => {
      setProducts(data);
    });
    return () => { unsubOrders(); unsubProducts(); };
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  
  const itemCounts: Record<string, number> = {};
  orders.forEach(o => o.items.forEach(i => {
      const name = i.product?.name || 'Unknown SKU';
      itemCounts[name] = (itemCounts[name] || 0) + i.quantity;
  }));
  const bestsellers = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
       <div className="w-10 h-10 border-4 border-[var(--color-admin-dark)] border-t-transparent rounded-full animate-spin" />
       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scaling Data Architecture</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between px-1">
        <div>
           <h1 className="text-2xl font-black text-[var(--color-admin-dark)] tracking-tight uppercase">Performance</h1>
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Live Ops Sync Active</p>
        </div>
        <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
           99.9% Up
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Today's Rev" value={`₹${todayRevenue}`} detail="14%" trend="up" icon={<TrendingUp size={20} />} color="bg-blue-500" />
        <MetricCard title="Active Flux" value={orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length} detail="2 New" trend="up" icon={<ShoppingBag size={20} />} color="bg-orange-500" />
        <MetricCard title="Unique Reach" value={new Set(orders.map(o => o.userId)).size} detail="3" trend="up" icon={<Users size={20} />} color="bg-purple-500" />
        <MetricCard title="Ops Velocity" value="98%" detail="1%" trend="down" icon={<Zap size={20} />} color="bg-red-500" />
      </div>

      <div className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bestsellers Today</h2>
            <ChevronRight size={14} className="text-gray-300" />
         </div>
         <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
            {bestsellers.map(([name, count], idx) => (
                <div key={name} className={`p-5 flex items-center justify-between ${idx !== bestsellers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                           <Award size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-[var(--color-admin-dark)] uppercase tracking-tight">{name}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{count} Units</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                         <span className="text-[10px] font-black text-[var(--color-admin-dark)]">{(count / (orders.length || 1) * 100).toFixed(0)}%</span>
                         <div className="w-16 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(count / (orders.length || 1)) * 100}%` }} className="h-full bg-[var(--color-admin-dark)] rounded-full" />
                         </div>
                    </div>
                </div>
            ))}
         </div>
      </div>

      <div className="bg-[var(--color-admin-dark)] rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-black/20">
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
            <Activity size={140} />
         </div>
         <div className="relative z-10 flex flex-col gap-2">
            <h3 className="text-xl font-black uppercase tracking-tight">Ops Predictor</h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed max-w-[80%]">Peak intensity expected between 6PM - 8PM. Suggest pre-baking 20% high-volume SKUs.</p>
            <button className="w-full mt-6 py-5 bg-white text-[var(--color-admin-dark)] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               Optimise Preparation Queue
            </button>
         </div>
      </div>
    </div>
  );
};
