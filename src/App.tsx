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
import { AdminOrders } from './pages/AdminOrders';
import { SavedAddresses } from './pages/SavedAddresses';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { AdminLayout } from './components/AdminLayout';
import { ScrollToTop } from './components/ScrollToTop';
import { KitchenMode } from './pages/KitchenMode';
import { MasterBakersDashboard } from './pages/MasterBakersDashboard';

import { LoadingScreen } from './components/LoadingScreen';
import { useAuth } from './context/AuthContext';
import { useProducts } from './context/ProductContext';
import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
  const { loading: authLoading } = useAuth();
  const { loading: productsLoading } = useProducts();
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  React.useEffect(() => {
    if (!authLoading && !productsLoading) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setIsInitialLoad(false), 800);
      return () => clearTimeout(timer);
    }
  }, [authLoading, productsLoading]);

  return (
    <AnimatePresence mode="wait">
      {isInitialLoad ? (
        <LoadingScreen key="loader" />
      ) : (
        <motion.div
          key="app-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="h-full w-full"
        >
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Main Layout containing both public and protected routes */}
              <Route path="/" element={<Layout />}>
                {/* Public Routes */}
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                
                {/* Protected Customer Routes */}
                <Route path="cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                <Route path="notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="addresses" element={<ProtectedRoute><SavedAddresses /></ProtectedRoute>} />
                
                {/* Admin Routes with Sidebar Layout — requires admin role */}
                <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="products" element={<AdminProducts />} />
                </Route>
              </Route>
              
              {/* Kitchen & Baker routes — admin only */}
              <Route path="/kitchen" element={<AdminRoute><KitchenMode /></AdminRoute>} />
              <Route path="/master-baker" element={<AdminRoute><MasterBakersDashboard /></AdminRoute>} />
            </Routes>
          </Router>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ProductProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </ProductProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
