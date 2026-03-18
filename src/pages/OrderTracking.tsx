import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Package, Truck, MapPin, Phone, MessageCircle, Search, RefreshCw } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const OrderTracking = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('id');
  const [orderIdInput, setOrderIdInput] = useState(orderIdParam || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (orderIdParam) {
      setLoading(true);
      const unsubscribe = onSnapshot(doc(db, 'orders', orderIdParam), (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
          setError('');
        } else {
          setError('Order not found. Please check the ID.');
          setOrder(null);
        }
        setLoading(false);
      }, (err) => {
        console.error("Error tracking order:", err);
        setError('Failed to track order. You may be offline or the order ID is invalid.');
        setLoading(false);
      });

      return () => unsubscribe();
    } else if (user && !orderIdParam) {
      const fetchLatestOrder = async () => {
        setLoading(true);
        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const latestDoc = querySnapshot.docs[0];
            navigate(`/track?id=${latestDoc.id}`, { replace: true });
          } else {
            setLoading(false);
          }
        } catch (err) {
          console.error("Error fetching latest order:", err);
          setLoading(false);
        }
      };
      fetchLatestOrder();
    }
  }, [orderIdParam, user, navigate]);

  const handleNextStatus = async () => {
    if (!order || !order.id) return;
    
    const statuses = ['received', 'confirmed', 'baking', 'quality_check', 'out_for_delivery', 'delivered'];
    const currentIndex = statuses.indexOf(order.status);
    
    if (currentIndex < statuses.length - 1) {
      setUpdating(true);
      try {
        await updateDoc(doc(db, 'orders', order.id), {
          status: statuses[currentIndex + 1]
        });
      } catch (err) {
        console.error("Error updating status:", err);
        toast.error("Failed to update status");
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      // Use navigate from react-router-dom for a smoother SPA experience
      // This will update the URL and trigger the useEffect for orderIdParam
      navigate(`/track?id=${orderIdInput.trim()}`);
    }
  };

  const getStatusIndex = (status: string) => {
    const statuses = ['received', 'confirmed', 'baking', 'quality_check', 'out_for_delivery', 'delivered'];
    return statuses.indexOf(status);
  };

  const steps = [
    { label: 'Order Received', icon: Package, key: 'received' },
    { label: 'Confirmed', icon: CheckCircle2, key: 'confirmed' },
    { label: 'Baking', icon: Clock, key: 'baking' },
    { label: 'Quality Check', icon: CheckCircle2, key: 'quality_check' },
    { label: 'Out for Delivery', icon: Truck, key: 'out_for_delivery' },
    { label: 'Delivered', icon: MapPin, key: 'delivered' }
  ];

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4">
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Track Order</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Enter Order ID (e.g. ZB1234)"
            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] shadow-sm"
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-terracotta)]">
            <Search size={20} />
          </button>
        </form>

        {loading && (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Locating your treats...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-center text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {order && (
          <div className="space-y-4">
            {/* Delivery Status & Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border-t-4 border-t-[var(--color-terracotta)]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[var(--color-chocolate)] mb-1">
                    {order.status === 'delivered' ? 'Delivered on' : 'Arriving by'}
                  </h2>
                  <p className="text-lg font-semibold text-[var(--color-terracotta)]">
                    {new Date(order.deliveryDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Slot: {order.deliverySlot}</p>
                </div>
                {isAdmin && (
                  <button 
                    onClick={handleNextStatus}
                    disabled={updating || currentStatusIndex === steps.length - 1}
                    className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-terracotta)] bg-[var(--color-beige)] px-3 py-1.5 rounded-full hover:bg-[var(--color-cream)] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={updating ? 'animate-spin' : ''} />
                    Update Status
                  </button>
                )}
              </div>
              
              <div className="relative pl-4">
                {/* Vertical Line */}
                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gray-100" />
                
                {/* Active Line */}
                <div 
                  className="absolute left-[27px] top-4 w-0.5 bg-[var(--color-terracotta)] transition-all duration-1000"
                  style={{ height: `${(currentStatusIndex / (steps.length - 1)) * 100}%` }}
                />

                <div className="space-y-8">
                  {steps.map((step, index) => {
                    const isActive = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    
                    return (
                      <div key={step.label} className="relative flex items-start gap-4">
                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
                          isActive ? 'bg-[var(--color-terracotta)] text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {isActive ? <CheckCircle2 size={14} /> : <div className="w-2 h-2 rounded-full bg-white" />}
                          
                          {isCurrent && (
                            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-terracotta)] animate-ping opacity-20" />
                          )}
                        </div>
                        
                        <div className="flex-1 pt-0.5">
                          <h4 className={`text-sm font-bold ${isActive ? 'text-[var(--color-chocolate)]' : 'text-gray-400'}`}>
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <p className="text-[10px] text-[var(--color-terracotta)] font-semibold uppercase tracking-wider mt-0.5">
                              Current Stage
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Package Items */}
            {order.items && order.items.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-sm"
              >
                <h3 className="text-sm font-bold text-gray-800 mb-4">Package Details</h3>
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 m-5 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-[var(--color-chocolate)] line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} • {item.variant.flavor}</p>
                        {item.isGiftWrap && <p className="text-[10px] text-[var(--color-terracotta)] font-medium mt-1">🎁 Gift Wrapped</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Order Info (Minimal) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-sm"
            >
              <h3 className="text-sm font-bold text-gray-800 mb-4">Order Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-medium text-[var(--color-chocolate)]">#{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date</span>
                  <span className="font-medium text-[var(--color-chocolate)]">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment</span>
                  <span className="font-medium text-gray-700 uppercase">{order.paymentMethod || 'PAID'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-[var(--color-chocolate)]">Total Amount</span>
                  <span className="text-[var(--color-terracotta)]">₹{order.total}</span>
                </div>
                <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-start">
                  <span className="text-gray-500">Delivering to</span>
                  <div className="text-right">
                    <span className="font-medium text-[var(--color-chocolate)] block">{order.customer?.name}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {!order && !loading && !error && (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-[var(--color-beige)] rounded-full flex items-center justify-center text-[var(--color-terracotta)] mx-auto mb-6">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-chocolate)] mb-2">Where are your treats?</h3>
            <p className="text-gray-500 text-sm">Enter your order ID from your confirmation WhatsApp to see real-time updates from JORA BAKES 's kitchen.</p>
          </div>
        )}

        {/* Support Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <button className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 text-[var(--color-chocolate)] hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <span className="text-xs font-semibold">WhatsApp Us</span>
          </button>
          
          <button className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center gap-2 text-[var(--color-chocolate)] hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Phone size={20} />
            </div>
            <span className="text-xs font-semibold">Call Support</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
};
