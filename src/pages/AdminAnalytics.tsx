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
  ChevronRight,
  Database
} from 'lucide-react';

const MetricCard = ({ title, value, detail, trend, icon, accent }: any) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-[#E8E2D9] shadow-sm flex flex-col justify-between group hover:border-[#D26E4B]/30 transition-all duration-500 hover:shadow-xl hover:shadow-[#D26E4B]/5 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
    <div className="flex justify-between items-start relative z-10">
      <div className={`w-12 h-12 rounded-2xl ${accent} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-[10px] font-black italic ${trend === 'up' ? 'text-[#7A8B6E]' : 'text-[#C17A6B]'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} className="stroke-[3]" /> : <ArrowDownRight size={14} className="stroke-[3]" />}
          {detail}
        </span>
      )}
    </div>
    <div className="relative z-10 mt-auto">
      <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-2 leading-none italic">{title}</p>
      <p className="text-3xl font-black text-[#1C1412] tracking-tighter italic leading-none">{value}</p>
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
      const name = i.product?.name || 'Unknown Product';
      itemCounts[name] = (itemCounts[name] || 0) + i.quantity;
  }));
  const bestsellers = Object.entries(itemCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
       <motion.div 
         animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
         transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
         className="w-12 h-12 border-4 border-[#E8E2D9] border-t-[#D26E4B] rounded-full shadow-lg" 
       />
       <span className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Synthesizing Performance Ledger</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-end justify-between px-1">
        <div>
           <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-2 italic leading-none">Intelligence Hub</p>
           <h1 className="text-4xl font-black text-[#1C1412] tracking-tighter leading-none italic uppercase">Performance.</h1>
        </div>
        <div className="bg-[#F0F2EF] text-[#7A8B6E] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border border-[#7A8B6E]/20 shadow-sm italic">
           <div className="w-2 h-2 bg-[#7A8B6E] rounded-full animate-pulse" />
           Sync: 99.9%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard title="Gross Rev" value={`Rs. ${todayRevenue.toLocaleString('en-IN')}`} detail="Today" trend="up" icon={<TrendingUp size={22} />} accent="bg-[#7A8B6E]" />
        <MetricCard title="Operational Flux" value={orders.filter(o => !['delivered', 'cancelled', 'cancelled_and_refunded'].includes(o.status)).length} detail="In Progress" trend="up" icon={<ShoppingBag size={22} />} accent="bg-[#D26E4B]" />
        <MetricCard title="Total Audited" value={orders.length} detail="All Time" trend="up" icon={<Database size={22} />} accent="bg-[#D4AF37]" />
        <MetricCard title="Reach Index" value={new Set(orders.map(o => o.userId)).size} detail="Unique Souls" trend="up" icon={<Users size={22} />} accent="bg-[#1C1412]" />
      </div>

      <div className="space-y-4">
         <div className="flex items-center justify-between px-1">
            <h2 className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Audited High-Volume Assets</h2>
            <ChevronRight size={18} className="text-[#D26E4B] opacity-20" />
         </div>
         <div className="bg-white rounded-[2.5rem] border border-[#E8E2D9] overflow-hidden shadow-sm divide-y divide-[#F5F0E8]">
            {bestsellers.map(([name, count], idx) => (
                <div key={name} className="p-6 flex items-center justify-between group hover:bg-[#FAF7F2]/50 transition-all">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white border border-[#E8E2D9] rounded-2xl flex items-center justify-center text-[#D4AF37] shadow-sm group-hover:scale-110 transition-transform duration-500">
                           <Award size={24} />
                        </div>
                        <div>
                           <p className="text-[13px] font-black text-[#1C1412] uppercase tracking-tighter italic group-hover:text-[#D26E4B] transition-colors">{name}</p>
                           <p className="text-[10px] text-[#8B8680] font-black uppercase tracking-[0.2em] mt-1.5 italic">{count} Units Commited</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 pr-2">
                         <span className="text-[11px] font-black text-[#D26E4B] italic">{(count / (orders.length || 1) * 100).toFixed(0)}% Index</span>
                         <div className="w-20 h-1.5 bg-[#F5F0E8] rounded-full overflow-hidden border border-white/50">
                            <motion.div 
                              initial={{ width: 0 }} 
                              animate={{ width: `${(count / (orders.length || 1)) * 100}%` }} 
                              className="h-full bg-gradient-to-r from-[#D4AF37] to-[#D26E4B] rounded-full shadow-inner" 
                            />
                         </div>
                    </div>
                </div>
            ))}
         </div>
      </div>

      <div className="bg-[#1C1412] rounded-[3.5rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-black/30 border border-white/5">
         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
            <Activity size={180} className="text-[#D26E4B]" />
         </div>
         <div className="relative z-10 flex flex-col gap-4">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic">Machine Intelligence Prediciton</h3>
            <p className="text-sm text-white/50 font-bold leading-relaxed max-w-[85%] italic">A heightened operational flux is anticipated between 18:00 - 20:00. Protocol suggests increasing inventory of high-volume assets by 20% to mitigate delay flux.</p>
            <button className="w-full mt-8 py-6 bg-[#D26E4B] text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-[#B85A3A] active:scale-95 transition-all italic border border-[#B85A3A]/50">
               Initiate Predictive Optimization
            </button>
         </div>
      </div>
    </div>
  );
};
