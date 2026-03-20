import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { subscribeToCollection, updateDocument, createDocument } from './services/firestore';
import { Order } from './types';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Package, Truck, RefreshCw, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminOrders = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');

  useEffect(() => {
    if (!isAdmin && !authLoading) {
      navigate('/');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    if (isAdmin) {
      setLoading(true);
      unsubscribe = subscribeToCollection<Order>(
        'orders',
        (fetchedOrders) => {
          // Sort orders by newest first
          setOrders(fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
        },
        (error) => {
          console.error("Failed to fetch orders:", error);
          toast.error("Failed to load orders");
          setLoading(false);
        }
      );
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAdmin, authLoading, navigate]);

  const handleStatusUpdate = async (order: Order, newStatus: string) => {
    setUpdating(order.id);
    try {
      await updateDocument('orders', order.id, { status: newStatus });
      
      // Generate real-time alerts for the user
      if (order.userId && order.userId !== 'guest') {
        let title = '';
        let message = '';
        
        if (newStatus === 'delivered') {
          title = 'Order Delivered! 🎉';
          message = `Your order #${order.id.slice(-6)} has been delivered. Enjoy your treats!`;
        } else if (newStatus === 'out_for_delivery') {
          title = 'Out for Delivery 🚚';
          message = `Your order #${order.id.slice(-6)} is on its way to you!`;
        } else if (newStatus === 'baking') {
          title = 'Baking in Progress 👨‍🍳';
          message = `We've started baking your order #${order.id.slice(-6)}!`;
        }

        if (title && message) {
          const notifId = `notif_${Date.now()}`;
          await createDocument('notifications', {
            id: notifId,
            userId: order.userId,
            title,
            message,
            type: 'order_status',
            read: false,
            createdAt: new Date().toISOString(),
            orderId: order.id
          }, notifId);
        }
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdating('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-500';
      case 'out_for_delivery': return 'text-blue-500';
      case 'baking': return 'text-orange-500';
      default: return 'text-[var(--color-terracotta)]';
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

  const statuses = ['received', 'confirmed', 'baking', 'quality_check', 'out_for_delivery', 'delivered'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)]">
        <div className="text-[var(--color-terracotta)] font-script text-2xl animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Manage Orders</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading orders...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-3xl p-6 shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="text-left">
                    <th className="font-semibold text-sm text-gray-500 py-2">Order ID</th>
                    <th className="font-semibold text-sm text-gray-500 py-2">User ID</th>
                    <th className="font-semibold text-sm text-gray-500 py-2">Total</th>
                    <th className="font-semibold text-sm text-gray-500 py-2">Status</th>
                    <th className="font-semibold text-sm text-gray-500 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 font-mono text-sm text-[var(--color-chocolate)]">#{order.id.slice(-6)}</td>
                      <td className="py-3 px-2 text-sm text-gray-600">{order.userId.slice(-6)}</td>
                      <td className="py-3 px-2 font-bold text-sm text-[var(--color-terracotta)]">₹{order.total}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-2">
                          {statuses.map(status => (
                            <button
                              key={status}
                              onClick={() => handleStatusUpdate(order, status)}
                              disabled={updating === order.id}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-colors ${order.status === status
                                ? 'bg-[var(--color-terracotta)] text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {updating === order.id && order.status === status ? <RefreshCw className="inline-block animate-spin mr-1" size={12} /> : null}
                              {status.replace('_', ' ')}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};