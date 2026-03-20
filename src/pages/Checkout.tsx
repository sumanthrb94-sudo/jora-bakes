import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, MessageCircle, Wallet, Banknote } from 'lucide-react';
import toast from 'react-hot-toast';
import { increment } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { createDocument, updateDocument } from '../services/firestore';
import { Order } from '../types';

export const Checkout = () => {
  const { cart, clearCart, cartTotal } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state || {};
  
  const [step, setStep] = useState(1); // 1: Payment Selection, 2: Success Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'whatsapp' | 'cod'>('razorpay');

  // Redirect to cart if they bypassed it
  useEffect(() => {
    if (step === 1 && (!checkoutState || !checkoutState.selectedAddress || cart.length === 0)) {
      navigate('/cart', { replace: true });
    }
  }, [checkoutState, cart, navigate, step]);

  const handlePayment = async () => {
      setIsProcessing(true);
      
      try {
        // 1. Mock Razorpay Flow
        if (paymentMethod === 'razorpay') {
          toast.loading('Opening secure payment gateway...', { duration: 1500 });
          // Simulate Razorpay SDK popup delay
          await new Promise(resolve => setTimeout(resolve, 2500));
          toast.success('Payment verified successfully!');
        }

        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newOrderId = `JB${timestamp}${random}`;
        
        console.log('Creating order:', newOrderId);

        const orderData: Order = {
          id: newOrderId,
          userId: user?.uid || 'guest',
          items: cart.map(item => ({
            id: item.id,
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
            customizations: item.customizations || [],
            specialRequest: item.specialRequest || '',
            isGiftWrap: item.isGiftWrap,
            giftMessage: item.giftMessage || '',
            deliveryDate: item.deliveryDate instanceof Date ? item.deliveryDate.toISOString() : item.deliveryDate,
            deliverySlot: item.deliverySlot
          })),
          customer: {
            name: profile?.name || 'Guest',
            phone: profile?.phone || '',
            email: profile?.email || ''
          },
          address: {
            street: checkoutState.selectedAddress?.street || 'No address provided',
            instructions: checkoutState.selectedAddress?.instructions || '',
            label: checkoutState.selectedAddress?.label || 'Delivery'
          },
          total: Number(checkoutState.grandTotal || (cartTotal + 50)),
          status: paymentMethod === 'razorpay' ? 'confirmed' : 'received',
          paymentMethod: paymentMethod,
          createdAt: new Date().toISOString(),
          deliveryDate: checkoutState.deliveryDate instanceof Date 
            ? checkoutState.deliveryDate.toISOString() 
            : (checkoutState.deliveryDate || new Date(Date.now() + 86400000).toISOString()),
          deliverySlot: checkoutState.deliveryTime || '10 AM - 1 PM',
          giftWrap: checkoutState.giftWrap || false
        };

        console.log('Attempting to save order to database...');
        
        await createDocument('orders', orderData, newOrderId);
        console.log('Order saved successfully');
        
        // Decrease stock quantity for each ordered item
        try {
          const stockUpdates = cart.map(item => {
            if (item.product.stockQuantity !== undefined) {
              return updateDocument('products', item.product.id, {
                stockQuantity: increment(-item.quantity) as unknown as number
              });
            }
            return Promise.resolve();
          });
          await Promise.all(stockUpdates);
        } catch (stockError) {
          console.error('Failed to update stock quantities:', stockError);
        }

        // 2. WhatsApp Redirection Flow
        if (paymentMethod === 'whatsapp') {
          const waNumber = "917799934943"; // Jora Bakes business number
          const text = `Hello JORA BAKES! 🍰\n\nI just placed an order on the app and want to confirm it via WhatsApp.\n\n*Order ID:* #${newOrderId}\n*Total:* ₹${checkoutState.grandTotal}\n*Delivery Date:* ${checkoutState.deliveryDate}\n\nPlease confirm my order!`;
          const encodedText = encodeURIComponent(text);
          window.open(`https://wa.me/${waNumber}?text=${encodedText}`, '_blank');
        }

        setOrderId(newOrderId);
        setStep(2);
        clearCart();
      } catch (err: unknown) {
        const error = err as any;
        console.error("Error in checkout flow:", error);
        let errorMessage = 'Something went wrong. Please try again.';
        
        if (error.message === 'Database operation timed out') {
          errorMessage = 'The request timed out. Please check your internet connection and try again.';
        } else {
          try {
            const parsedError = JSON.parse(error.message);
            errorMessage = parsedError.error || errorMessage;
          } catch (e) {
            errorMessage = error?.message || errorMessage;
          }
        }
        
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-[var(--color-primary)] flex flex-col items-center w-full max-w-[428px] mx-auto p-8 pt-16 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-8 border-[3px] border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-cream)] shadow-lg shadow-[var(--color-accent)]/10 shrink-0"
        >
          <CheckCircle2 size={48} strokeWidth={1.5} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full space-y-4 mb-10"
        >
          <div className="inline-block border border-[var(--color-accent)] text-[var(--color-accent)] px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-1">
            {paymentMethod === 'cod' ? 'Order Received' : 'Payment Successful'}
          </div>
          <h2 className="font-script text-5xl text-[var(--color-shadow)] leading-tight">Order Confirmed</h2>
          <p className="text-[var(--color-tertiary)] text-sm px-4 leading-relaxed font-medium">
            JORA BAKES has received your order. We are preparing your artisanal treats with care.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[var(--color-cream)] rounded-[32px] p-8 w-full mb-10 border border-[var(--color-secondary)]/30 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[var(--color-primary)] rounded-full opacity-50 border border-[var(--color-secondary)]/20" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8 gap-2">
              <div className="text-left">
                <p className="text-[10px] text-[var(--color-tertiary)] uppercase font-bold tracking-wider mb-1.5">Order No.</p>
                <p className="font-mono font-bold text-[var(--color-shadow)] text-sm sm:text-base tracking-wide">#{orderId}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-[var(--color-tertiary)] uppercase font-bold tracking-wider mb-1.5">Total Paid</p>
                <p className="font-bold text-[var(--color-accent)] text-xl sm:text-2xl">₹{checkoutState.grandTotal || (cartTotal + 50)}</p>
              </div>
            </div>
            
            <div className="space-y-5 pt-6 border-t border-[var(--color-secondary)]/30">
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-tertiary)] font-bold uppercase tracking-wider">Status</span>
                <span className="bg-[var(--color-primary)] text-[var(--color-accent)] px-4 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border border-[var(--color-secondary)]/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
                  {paymentMethod === 'razorpay' ? 'Confirmed' : 'Received'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-tertiary)] font-bold uppercase tracking-wider">Delivery</span>
                <span className="text-sm font-bold text-[var(--color-shadow)]">
                  {checkoutState.deliveryDate ? new Date(checkoutState.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tomorrow'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-tertiary)] font-bold uppercase tracking-wider">Time</span>
                <span className="text-sm font-bold text-[var(--color-shadow)]">
                  {checkoutState.deliveryTime || '10 AM - 1 PM'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full space-y-4"
        >
          <button 
            onClick={() => navigate(`/track?id=${orderId}`)}
            className="w-full bg-[var(--color-shadow)] text-[var(--color-primary)] py-4 rounded-2xl font-bold text-sm uppercase tracking-wider shadow-xl hover:opacity-90 transition-all border border-[var(--color-shadow)]"
          >
            Track My Treats
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 text-[var(--color-tertiary)] font-bold text-sm uppercase tracking-wider hover:text-[var(--color-shadow)] transition-all"
          >
            Back to Menu
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-3 flex items-center gap-3 pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--color-chocolate)] hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-black text-lg text-[var(--color-chocolate)] tracking-tight leading-none">Payment</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Secure Checkout</p>
        </div>
      </div>

      <div className="p-3">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Select Payment Method</p>
              
              <div className="space-y-3">
                {/* Razorpay Mock */}
                <label 
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${paymentMethod === 'razorpay' ? 'border-[var(--color-terracotta)] bg-orange-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'razorpay' ? 'bg-[var(--color-terracotta)] text-white' : 'bg-gray-50 text-gray-500'}`}>
                      <Wallet size={20} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[var(--color-chocolate)] block">UPI, Cards & NetBanking</span>
                      <span className="text-[10px] font-medium text-gray-500">Powered by Razorpay</span>
                    </div>
                  </div>
                  {paymentMethod === 'razorpay' && <CheckCircle2 size={20} className="text-[var(--color-terracotta)] absolute right-4" />}
                </label>
                
                {/* WhatsApp Mock */}
                <label 
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${paymentMethod === 'whatsapp' ? 'border-[#25D366] bg-[#25D366]/5' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'whatsapp' ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-500'}`}>
                      <MessageCircle size={20} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[var(--color-chocolate)] block">Order via WhatsApp</span>
                      <span className="text-[10px] font-medium text-gray-500">Fast & Personalized Service</span>
                    </div>
                  </div>
                  {paymentMethod === 'whatsapp' && <CheckCircle2 size={20} className="text-[#25D366] absolute right-4" />}
                </label>

                {/* COD */}
                <label 
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${paymentMethod === 'cod' ? 'border-[var(--color-terracotta)] bg-orange-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${paymentMethod === 'cod' ? 'bg-[var(--color-terracotta)] text-white' : 'bg-gray-50 text-gray-500'}`}>
                      <Banknote size={20} />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-[var(--color-chocolate)] block">Cash on Delivery</span>
                      <span className="text-[10px] font-medium text-gray-500">Pay when your treats arrive</span>
                    </div>
                  </div>
                  {paymentMethod === 'cod' && <CheckCircle2 size={20} className="text-[var(--color-terracotta)] absolute right-4" />}
                </label>
              </div>
            </div>
          </motion.div>
      </div>

      {/* Fixed Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.08)] p-4 z-30 pb-safe">
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className={`w-full py-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 text-white ${paymentMethod === 'whatsapp' ? 'bg-[#25D366] hover:bg-[#20bd5a]' : 'bg-[var(--color-terracotta)] hover:bg-orange-600 active:scale-[0.98]'}`}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-[var(--color-cream)] border-t-transparent rounded-full animate-spin" />
          ) : (
            paymentMethod === 'whatsapp' ? `Send Order to WhatsApp • ₹${checkoutState.grandTotal}` : `Pay ₹${checkoutState.grandTotal}`
          )}
        </button>
      </div>
    </div>
  );
};
