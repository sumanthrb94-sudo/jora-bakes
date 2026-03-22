import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  ChefHat,
  Monitor,
  LayoutGrid,
  Maximize2
} from 'lucide-react';
import { subscribeToCollection, updateDocument } from '../services/firestore';
import { Order } from '../types';

export const KitchenMode = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show active kitchen orders (confirmed or baking)
    const unsub = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data.filter(o => ['confirmed', 'baking'].includes(o.status)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleComplete = async (orderId: string) => {
    await updateDocument('orders', orderId, { status: 'out_for_delivery' });
  };

  const handleStartBaking = async (orderId: string) => {
      await updateDocument('orders', orderId, { status: 'baking' });
  };

  return (
    <div className="fixed inset-0 bg-[#1C1412] z-[300] flex flex-col overflow-hidden text-[#FFF9F5] font-sans">
       {/* KDS Header */}
       <header className="h-20 shrink-0 bg-white/5 border-b border-white/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
             <button onClick={() => navigate('/admin')} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <ArrowLeft size={24} />
             </button>
             <div className="flex flex-col">
                <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                   <ChefHat size={28} className="text-[#D4AF37]" />
                   Kitchen Hub <span className="text-[#D4AF37] opacity-50 px-3 py-1 bg-white/5 rounded-lg text-sm ml-2">LIVE</span>
                </h1>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFF9F5]/40">Active Orders: {orders.length}</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right flex flex-col">
                <span className="text-lg font-black tracking-tighter">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFF9F5]/40">Operational Pulse</span>
             </div>
             <div className="w-px h-10 bg-white/10 mx-2" />
             <Maximize2 size={24} className="opacity-40" />
          </div>
       </header>

       {/* KDS Main Grid */}
       <main className="flex-1 overflow-x-auto p-6 flex gap-6 hide-scrollbar">
          {loading ? (
             <div className="flex-1 flex items-center justify-center">
                <ChefHat size={64} className="text-white/10 animate-pulse" />
             </div>
          ) : orders.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/5 rounded-[3rem]">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                   <Monitor size={40} />
                </div>
                <p className="text-lg font-black uppercase tracking-widest text-white/20">Kitchen Empty. Good Job!</p>
             </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={order.id}
                  className="w-[380px] shrink-0 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col p-6 shadow-2xl shadow-black/40"
                >
                   {/* Order Card Head */}
                   <div className="flex items-start justify-between mb-6">
                      <div className="flex flex-col">
                         <span className="text-sm font-black text-[#D4AF37] uppercase tracking-widest">#{order.id.slice(-4).toUpperCase()}</span>
                         <h2 className="text-xl font-black">Customer #{order.userId.slice(-4)}</h2>
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                            <Clock size={12} /> Received 12 mins ago
                         </p>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${order.status === 'baking' ? 'bg-[#D4AF37] text-[#1C1412]' : 'bg-white/10 text-white'}`}>
                         {order.status}
                      </div>
                   </div>

                   {/* Items List */}
                   <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-white/5 p-4 rounded-3xl border border-white/5 group hover:bg-white/10 transition-colors">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-[#D4AF37] text-[#1C1412] rounded-xl flex items-center justify-center font-black">{item.quantity}x</div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-black tracking-tight">{item.product.name}</span>
                                    {item.variant && <span className="text-[10px] font-bold text-white/30">{item.variant.name}</span>}
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* Actions */}
                   <div className="mt-8 grid grid-cols-2 gap-3">
                      {order.status === 'confirmed' ? (
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleStartBaking(order.id)}
                          className="col-span-2 py-5 bg-[#D4AF37] text-[#1C1412] rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl"
                        >
                           < ChefHat size={20} /> Start Baking
                        </motion.button>
                      ) : (
                        <motion.button 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleComplete(order.id)}
                          className="col-span-2 py-5 bg-[#00B189] text-white rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-[#00B189]/20"
                        >
                           <CheckCircle2 size={20} /> Ready for Dispatch
                        </motion.button>
                      )}
                   </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
       </main>
    </div>
  );
};
