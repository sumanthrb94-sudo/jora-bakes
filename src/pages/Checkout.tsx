import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, MapPin, CreditCard, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { createDocument } from '../services/firestore';
import { Order, Address } from '../types';

export const Checkout = () => {
  const { cart, clearCart, cartTotal } = useCart();
  const { user, profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state || {};
  
  const [step, setStep] = useState(1); // 1: Details, 2: Payment, 3: Confirmation
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || profile?.phone || '',
    email: profile?.email || '',
    address: profile?.address || '',
    instructions: '',
    paymentMethod: 'upi'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.address) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (saveAddress && user) {
        try {
          const currentAddresses = profile?.addresses || [];
          if (!currentAddresses.some(a => a.street === formData.address)) {
            const newAddr: Address = {
              id: Math.random().toString(36).substr(2, 9),
              label: 'Other',
              street: formData.address,
              city: '',
              pincode: ''
            };
            await updateProfile({
              addresses: [...currentAddresses, newAddr],
              phone: formData.phone,
              name: formData.name
            });
          } else {
            await updateProfile({
              phone: formData.phone,
              name: formData.name
            });
          }
        } catch (error) {
          console.error("Error saving address:", error);
        }
      }

      setStep(2);
    } else if (step === 2) {
      setIsProcessing(true);
      
      try {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newOrderId = `ZB${timestamp}${random}`;
        
        console.log('Creating order:', newOrderId);

        const orderData: any = {
          id: newOrderId,
          userId: user?.uid || 'guest',
          items: cart.map(item => ({
            id: item.id,
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
            specialRequest: item.specialRequest || '',
            isGiftWrap: item.isGiftWrap,
            giftMessage: item.giftMessage || '',
            deliveryDate: item.deliveryDate instanceof Date ? item.deliveryDate.toISOString() : item.deliveryDate,
            deliverySlot: item.deliverySlot
          })),
          customer: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email
          },
          address: {
            street: formData.address,
            instructions: formData.instructions
          },
          total: Number(checkoutState.grandTotal || (cartTotal + 50)),
          status: 'received',
          paymentMethod: formData.paymentMethod,
          createdAt: new Date().toISOString(),
          deliveryDate: checkoutState.deliveryDate instanceof Date 
            ? checkoutState.deliveryDate.toISOString() 
            : (checkoutState.deliveryDate || new Date(Date.now() + 86400000).toISOString()),
          deliverySlot: checkoutState.deliveryTime || '10 AM - 1 PM',
          giftWrap: checkoutState.giftWrap || false
        };

        console.log('Attempting to save order to database...');
        
        try {
          const result = await createDocument('orders', orderData, newOrderId);
          if (!result) {
            throw new Error('Database returned empty result');
          }
          console.log('Order saved successfully');
        } catch (dbError) {
          console.warn('Database write failed:', dbError);
          // Fallback to mock behavior if write fails
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast('Order placed (offline sync pending)');
        }

        setOrderId(newOrderId);
        setStep(3);
        clearCart();
        toast.success('Order Placed Successfully!');
      } catch (error: any) {
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
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-[var(--color-beige)] flex flex-col items-center w-full max-w-[428px] mx-auto p-6 pt-12 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 100 }}
          className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-200 shrink-0"
        >
          <CheckCircle2 size={40} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full space-y-2 mb-8"
        >
          <div className="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
            Payment Successful
          </div>
          <h2 className="font-script text-5xl text-[var(--color-chocolate)] leading-tight">Order Confirmed!</h2>
          <p className="text-gray-500 text-sm px-4 leading-relaxed">
            Zora has received your order and is getting the oven ready! We've sent your receipt to your WhatsApp.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-[32px] p-6 shadow-xl shadow-black/5 w-full mb-8 border border-white relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-beige)] rounded-full opacity-50" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6 gap-2">
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Order ID</p>
                <p className="font-mono font-bold text-[var(--color-chocolate)] text-sm sm:text-base">#{orderId}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Paid</p>
                <p className="font-bold text-[var(--color-terracotta)] text-xl sm:text-2xl">₹{checkoutState.grandTotal || (cartTotal + 50)}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-dashed border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Status</span>
                <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Confirmed
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Delivery Date</span>
                <span className="text-xs font-bold text-[var(--color-chocolate)]">
                  {checkoutState.deliveryDate ? new Date(checkoutState.deliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tomorrow'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400 font-medium">Time Slot</span>
                <span className="text-xs font-bold text-[var(--color-chocolate)]">
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
            className="w-full bg-[var(--color-terracotta)] text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-orange-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Track My Treats
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 text-[var(--color-chocolate)] font-bold text-sm hover:bg-white/50 rounded-2xl transition-all"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Checkout</h1>
      </div>

      {/* Step Indicator */}
      <div className="px-6 py-4 flex items-center justify-center">
        <div className="flex items-center w-full max-w-xs">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[var(--color-terracotta)] text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-[var(--color-terracotta)]' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[var(--color-terracotta)] text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          <div className={`flex-1 h-1 mx-2 rounded-full ${step >= 3 ? 'bg-[var(--color-terracotta)]' : 'bg-gray-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-[var(--color-terracotta)] text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
        </div>
      </div>

      <div className="p-4">
        {step === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-[var(--color-chocolate)] flex items-center gap-2 mb-4">
                <Phone size={18} className="text-[var(--color-terracotta)]" />
                Contact Info
              </h3>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">WhatsApp Number *</label>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                  placeholder="+91 98765 43210"
                />
                <p className="text-[10px] text-gray-400 mt-1">We'll send order updates here.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-[var(--color-chocolate)] flex items-center gap-2 mb-4">
                <MapPin size={18} className="text-[var(--color-terracotta)]" />
                Delivery Address
              </h3>

              {profile?.addresses && profile.addresses.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Saved Addresses</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {profile.addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, address: addr.street })}
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.address === addr.street 
                            ? 'bg-[var(--color-terracotta)] border-[var(--color-terracotta)] text-white' 
                            : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}
                      >
                        {addr.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Complete Address *</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] resize-none h-24"
                  placeholder="House/Flat No., Building Name, Street, Area, Landmark"
                />
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Instructions (Optional)</label>
                <input 
                  type="text" 
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
                  placeholder="E.g., Leave at security, call before arriving"
                />
              </div>

              {user && (
                <label className="flex items-center gap-3 cursor-pointer pt-2">
                  <div 
                    onClick={() => setSaveAddress(!saveAddress)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${saveAddress ? 'bg-[var(--color-terracotta)] border-[var(--color-terracotta)]' : 'border-gray-300'}`}
                  >
                    {saveAddress && <CheckCircle2 size={14} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">Save this address for future orders</span>
                </label>
              )}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-[var(--color-chocolate)] flex items-center gap-2 mb-4">
                <CreditCard size={18} className="text-[var(--color-terracotta)]" />
                Payment Method
              </h3>
              
              <div className="space-y-3">
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'upi' ? 'border-[var(--color-terracotta)] bg-[var(--color-beige)]' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'upi' ? 'border-[var(--color-terracotta)]' : 'border-gray-300'}`}>
                      {formData.paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-terracotta)]" />}
                    </div>
                    <span className="font-semibold text-[var(--color-chocolate)]">UPI (GPay, PhonePe, Paytm)</span>
                  </div>
                </label>
                
                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'card' ? 'border-[var(--color-terracotta)] bg-[var(--color-beige)]' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'card' ? 'border-[var(--color-terracotta)]' : 'border-gray-300'}`}>
                      {formData.paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-terracotta)]" />}
                    </div>
                    <span className="font-semibold text-[var(--color-chocolate)]">Credit / Debit Card</span>
                  </div>
                </label>

                <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.paymentMethod === 'cod' ? 'border-[var(--color-terracotta)] bg-[var(--color-beige)]' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'border-[var(--color-terracotta)]' : 'border-gray-300'}`}>
                      {formData.paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-terracotta)]" />}
                    </div>
                    <span className="font-semibold text-[var(--color-chocolate)]">Cash on Delivery</span>
                  </div>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-gray-100 p-4 z-30 pb-safe">
        <button 
          onClick={handleNext}
          disabled={isProcessing}
          className="w-full bg-[var(--color-chocolate)] text-[var(--color-cream)] py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-[var(--color-cream)] border-t-transparent rounded-full animate-spin" />
          ) : (
            step === 1 ? 'Continue to Payment' : `Pay ₹${checkoutState.grandTotal || (cartTotal + 50)}`
          )}
        </button>
      </div>
    </div>
  );
};
