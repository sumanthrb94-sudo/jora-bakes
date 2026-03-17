// c:\Users\91779\OneDrive\Desktop\JORA-BAKES\jora-bakes\src\pages\AdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../services/firestore';
import { UserProfile, Order } from '../types'; // Import types from the new types.ts file
import { motion } from 'framer-motion';
import { Package, Users, Search, ExternalLink } from 'lucide-react';

export const AdminDashboard = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  // Fetch data if admin
  useEffect(() => {
    if (isAdmin) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const fetchedOrders = await getDocuments<Order>('orders');
          setOrders(fetchedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
          console.error("Failed to fetch orders for admin:", error);
        } finally {
          setOrdersLoading(false);
        }
      };

      const fetchUsers = async () => {
        setUsersLoading(true);
        try {
          const fetchedUsers = await getDocuments<UserProfile>('users');
          setUsers(fetchedUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
          console.error("Failed to fetch users for admin:", error);
        } finally {
          setUsersLoading(false);
        }
      };

      fetchOrders();
      fetchUsers();
    }
  }, [isAdmin]);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    order.userId.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(orderSearchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--color-beige)] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4">
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Manage orders, users, and products.</p>
      </div>

      <div className="p-4 space-y-8">
        {/* Orders Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package size={24} className="text-[var(--color-terracotta)]" />
            <h2 className="text-xl font-bold text-[var(--color-chocolate)]">Recent Orders</h2>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              value={orderSearchTerm}
              onChange={(e) => setOrderSearchTerm(e.target.value)}
              placeholder="Search orders by ID, User ID, Status..."
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)] pr-10"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {ordersLoading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-4 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading orders...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders found.</p>
              ) : (
                filteredOrders.slice(0, 10).map(order => ( // Show top 10 for brevity
                  <div key={order.id} className="flex items-center justify-between bg-[var(--color-beige)] p-3 rounded-xl">
                    <div>
                      <p className="font-semibold text-[var(--color-chocolate)] text-sm">#{order.id.slice(-6)}</p>
                      <p className="text-xs text-gray-600">Status: <span className="font-medium capitalize">{order.status.replace('_', ' ')}</span></p>
                      <p className="text-xs text-gray-500">Total: ₹{order.total}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/track-order?id=${order.id}`)}
                      className="text-[var(--color-terracotta)] hover:text-[var(--color-chocolate)] transition-colors"
                      title="View Order Details"
                    >
                      <ExternalLink size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
          <button
            onClick={() => navigate('/admin/orders')} // Placeholder for a dedicated all orders page
            className="w-full mt-4 py-3 bg-[var(--color-terracotta)] text-white rounded-xl font-bold hover:bg-[var(--color-chocolate)] transition-colors"
          >
            View All Orders
          </button>
        </motion.div>

        {/* Users Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users size={24} className="text-[var(--color-terracotta)]" />
            <h2 className="text-xl font-bold text-[var(--color-chocolate)]">Users</h2>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search users by Name, Email, ID..."
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)] pr-10"
            />
            <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {usersLoading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-4 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading users...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users found.</p>
              ) : (
                filteredUsers.slice(0, 10).map(user => ( // Show top 10 for brevity
                  <div key={user.uid} className="flex items-center justify-between bg-[var(--color-beige)] p-3 rounded-xl">
                    <div>
                      <p className="font-semibold text-[var(--color-chocolate)] text-sm">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">Role: {user.role}</p>
                    </div>
                    {/* Add actions like 'Edit User' or 'View Profile' here */}
                  </div>
                ))
              )}
            </div>
          )}
          <button
            onClick={() => navigate('/admin/users')} // Placeholder for a dedicated all users page
            className="w-full mt-4 py-3 bg-[var(--color-terracotta)] text-white rounded-xl font-bold hover:bg-[var(--color-chocolate)] transition-colors"
          >
            View All Users
          </button>
        </motion.div>

        {/* Products Section - Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 shadow-sm text-center"
        >
          <h2 className="text-xl font-bold text-[var(--color-chocolate)] mb-4">Product Management</h2>
          <p className="text-gray-600 mb-4">Add, edit, or remove products from your store.</p>
          <button
            onClick={() => navigate('/admin/products')} // Placeholder for a dedicated product management page
            className="w-full py-3 bg-[var(--color-sage)] text-white rounded-xl font-bold hover:bg-[var(--color-chocolate)] transition-colors"
          >
            Manage Products
          </button>
        </motion.div>
      </div>
    </div>
  );
};