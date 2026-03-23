import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection } from '../services/firestore';
import { Order } from '../types';
import { Package, ChevronRight, Clock, CheckCircle2, Truck, MapPin, ArrowLeft } from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';
import { LoadingScreen } from '../components/LoadingScreen';

export const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCollection<Order>(
      'orders',
      (data) => {
        // Sort manually in memory if needed, or just show as is for now
        const sortedData = [...data].sort((a, b) => {
          const dateA = new Date(a.createdAt as string).getTime();
          const dateB = new Date(b.createdAt as string).getTime();
          return dateB - dateA;
        });
        setOrders(sortedData);
        setLoading(false);
      },
      (error) => {
        console.error("Order history subscription failed:", error);
        setLoading(false);
      },
      where('userId', '==', user.uid)
    );

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-50';
      case 'out_for_delivery': return 'text-blue-500 bg-blue-50';
      case 'baking': return 'text-orange-500 bg-orange-50';
      default: return 'text-[var(--color-terracotta)] bg-[var(--color-beige)]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 size={14} />;
      case 'out_for_delivery': return <Truck size={14} />;
      case 'baking': return <Clock size={14} />;
      default: return <Package size={14} />;
    }
  };

  if (loading) {
    return <LoadingScreen text="Fetching your orders..." />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">My Orders</h1>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-[var(--color-beige)] rounded-full flex items-center justify-center text-[var(--color-terracotta)] mx-auto mb-6">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-chocolate)] mb-2">No orders yet</h3>
            <p className="text-gray-500 text-sm mb-6">Your treats are waiting to be baked! Start your first order today.</p>
            <button 
              onClick={() => navigate('/shop')}
              className="bg-[var(--color-terracotta)] text-white px-8 py-3 rounded-full font-bold shadow-md"
            >
              Shop Now
            </button>
          </div>
        ) : (
          orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/track?id=${order.id}`)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-[var(--color-terracotta)] transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-400">#{order.id}</span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt as any).toLocaleDateString(undefined, { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--color-chocolate)]">Rs. {order.total}</div>
                  <div className="text-[10px] text-gray-400">{order.items.length} items</div>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-2">
                {order.items.map((item, i) => (
                  <div key={i} className="shrink-0 w-12 h-12 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                    {item.product?.images?.[0] ? (
                      <img 
                        src={item.product.images[0]} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[8px] text-gray-400 text-center p-1">
                        {item.product?.name || 'Item'}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                  <MapPin size={12} className="text-[var(--color-sage)]" />
                  <span className="truncate max-w-[180px]">{order.address.street}</span>
                </div>
                <div className="flex items-center gap-1 text-[var(--color-terracotta)] font-bold text-xs">
                  Track Order <ChevronRight size={14} />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
