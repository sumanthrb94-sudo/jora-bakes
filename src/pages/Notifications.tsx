import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToCollection, updateDocument } from '../services/firestore';
import { Notification } from '../types';
import { Bell, ChevronRight, ArrowLeft, Package, Clock, CheckCircle2, Truck, Trash2 } from 'lucide-react';
import { where, orderBy } from 'firebase/firestore';

export const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCollection<Notification>(
      'notifications',
      (data) => {
        setNotifications(data);
        setLoading(false);
      },
      undefined,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDocument('notifications', id, { read: true });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order_status': return <Package size={18} />;
      case 'promotion': return <Bell size={18} />;
      default: return <Bell size={18} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-beige)]">
        <div className="text-[var(--color-terracotta)] font-script text-2xl animate-pulse">
          Loading your alerts...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Notifications</h1>
      </div>

      <div className="p-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="w-20 h-20 bg-[var(--color-beige)] rounded-full flex items-center justify-center text-[var(--color-terracotta)] mx-auto mb-6">
              <Bell size={40} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-chocolate)] mb-2">All quiet here</h3>
            <p className="text-gray-500 text-sm">We'll notify you here when your treats are on the move!</p>
          </div>
        ) : (
          notifications.map((notif, index) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                markAsRead(notif.id);
                if (notif.orderId) navigate(`/track?id=${notif.orderId}`);
              }}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 cursor-pointer transition-all ${
                notif.read ? 'border-gray-200 opacity-75' : 'border-[var(--color-terracotta)]'
              }`}
            >
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  notif.read ? 'bg-gray-100 text-gray-400' : 'bg-[var(--color-beige)] text-[var(--color-terracotta)]'
                }`}>
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm font-bold ${notif.read ? 'text-gray-500' : 'text-[var(--color-chocolate)]'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{notif.message}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
