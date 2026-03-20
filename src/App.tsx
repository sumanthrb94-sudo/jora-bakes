/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Profile } from './pages/Profile';
import { OrderTracking } from './pages/OrderTracking';
import { OrderHistory } from './pages/OrderHistory';
import { Settings } from './pages/Settings';
import { AdminProducts } from './pages/AdminProducts';
import { Notifications } from './pages/Notifications';
import { AdminOrders } from './AdminOrders';
import { SavedAddresses } from './pages/SavedAddresses';
import { AdminDashboard } from './AdminDashboard'; // Import AdminDashboard
import { ProtectedRoute } from './components/ProtectedRoute';
import { ScrollToTop } from './components/ScrollToTop';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <Router>
              <ScrollToTop />
              <Routes>
                {/* Layout is now unlocked so guests can browse Home, Shop, and Cart */}
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="shop" element={<Shop />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="track" element={<OrderTracking />} />
                  
                  {/* Profile handles its own auth internally to show a custom message */}
                  <Route path="profile" element={<Profile />} />
                  
                  {/* Protected Routes - These strictly require login */}
                  <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                  <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                  <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="addresses" element={<ProtectedRoute><SavedAddresses /></ProtectedRoute>} />
                  <Route path="admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
                  <Route path="admin/orders" element={<ProtectedRoute><AdminOrders /></ProtectedRoute>} />
                </Route>
              </Routes>
            </Router>
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
