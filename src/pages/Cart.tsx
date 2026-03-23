import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, ArrowLeft, Gift, Calendar, Clock, ReceiptText, ShoppingBag, ChevronRight, MapPin, Home } from 'lucide-react';

export const Cart = () => {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [giftWrap, setGiftWrap] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(profile?.addresses?.[0] || null);

  // Hydrate address if profile loads asynchronously
  useEffect(() => {
    if (profile?.addresses?.length && !selectedAddress) {
      setSelectedAddress(profile.addresses[0]);
    }
  }, [profile, selectedAddress]);

  const deliveryFee = cartTotal > 999 ? 0 : 50;
  const giftWrapFee = giftWrap ? 100 : 0;
  const grandTotal = cartTotal + deliveryFee + giftWrapFee;

  // Enforce 1-day prior ordering system
  const minDateObj = new Date();
  minDateObj.setDate(minDateObj.getDate() + 1);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-beige)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=400" 
            alt="Empty Box" 
            className="w-32 h-32 object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="font-script text-4xl text-[var(--color-chocolate)] mb-4">Your box is empty</h2>
        <p className="text-gray-500 mb-8">Looks like you haven't added any treats yet.</p>
        <Link 
          to="/shop" 
          className="bg-[var(--color-terracotta)] text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:bg-opacity-90 transition-all"
        >
          Explore Our Goodies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-48">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Your Box of Goodies</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Cart Items */}
        <div className="space-y-4">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl p-4 shadow-sm flex gap-4"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-50">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-[var(--color-chocolate)] text-sm line-clamp-2 pr-4">{item.product.name}</h3>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="text-xs font-bold text-gray-500 mb-1">
                    {item.variant.weight}
                  </div>

                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-[11px] text-gray-400 font-medium mb-1.5 space-y-0.5">
                      {item.customizations.map((c, i) => (
                        <div key={i}>{c.groupName}: {c.optionName} {c.price > 0 ? `(+Rs. ${c.price})` : ''}</div>
                      ))}
                    </div>
                  )}
                  
                  {item.specialRequest && (
                    <div className="text-xs text-[var(--color-sage)] italic mb-2 line-clamp-1">
                      Note: {item.specialRequest}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div className="font-bold text-[var(--color-chocolate)]">
                      Rs. {(item.product.price + item.variant.priceModifier) * item.quantity}
                    </div>
                    
                    <div className="flex items-center bg-[var(--color-beige)] rounded-full px-2 py-1">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-[var(--color-chocolate)]"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-[var(--color-chocolate)]"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Delivery Address Block */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-[var(--color-chocolate)] flex items-center gap-2">
              <MapPin size={18} className="text-[var(--color-terracotta)]" />
              Delivery Address
            </h3>
            <button 
              onClick={() => navigate('/addresses')} 
              className="text-xs font-bold text-[var(--color-terracotta)] bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
            >
              {selectedAddress ? 'Change' : 'Add'}
            </button>
          </div>

          {selectedAddress ? (
            <div className="flex gap-3 items-start bg-gray-50/50 p-3 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                {selectedAddress.label === 'Home' ? <Home size={14} className="text-[var(--color-terracotta)]" /> : <MapPin size={14} className="text-[var(--color-terracotta)]" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-[var(--color-chocolate)]">{selectedAddress.label}</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-relaxed font-medium">{selectedAddress.street}</p>
                {selectedAddress.instructions && <p className="text-[10px] text-[var(--color-terracotta)] mt-1 font-bold">Note: {selectedAddress.instructions}</p>}
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 text-[var(--color-terracotta)] p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
              <MapPin size={14} /> Please add a delivery address to proceed.
            </div>
          )}
        </div>

        {/* Delivery Options */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-[var(--color-chocolate)] flex items-center gap-2">
            <Calendar size={18} className="text-[var(--color-terracotta)]" />
            Delivery Details
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Select Delivery Date</label>
              <input 
                type="date" 
                value={deliveryDate}
                min={minDateStr}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)]"
              />
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Select Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '10 AM - 1 PM',
                  '2 PM - 6 PM',
                  '6 PM - 9 PM'
                ].map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setDeliveryTime(slot)}
                    className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                      deliveryTime === slot
                        ? 'bg-[var(--color-terracotta)] border-[var(--color-terracotta)] text-white shadow-md'
                        : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock size={14} />
                      {slot}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gift Wrap */}
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--color-beige)] p-2 rounded-full text-[var(--color-terracotta)]">
              <Gift size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-[var(--color-chocolate)]">Add Gift Wrap</h4>
              <p className="text-xs text-gray-500">Includes a handwritten note</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[var(--color-chocolate)]">+Rs. 100</span>
            <input 
              type="checkbox" 
              checked={giftWrap}
              onChange={(e) => setGiftWrap(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[var(--color-terracotta)] focus:ring-[var(--color-terracotta)]"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-[var(--color-chocolate)] mb-2">Order Summary</h3>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span className="font-medium text-[var(--color-chocolate)]">Rs. {cartTotal}</span>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Delivery Fee</span>
            <span className="font-medium text-[var(--color-chocolate)]">
              {deliveryFee === 0 ? <span className="text-green-600">Free</span> : `Rs. ${deliveryFee}`}
            </span>
          </div>
          
          {giftWrap && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Gift Wrap</span>
              <span className="font-medium text-[var(--color-chocolate)]">Rs. 100</span>
            </div>
          )}
          
          <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between items-center">
            <span className="font-bold text-[var(--color-chocolate)]">Grand Total</span>
            <span className="font-bold text-xl text-[var(--color-terracotta)]">Rs. {grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-[72px] left-0 right-0 max-w-[428px] mx-auto bg-white border-t border-gray-100 p-4 z-30">
        <button 
          onClick={() => navigate('/checkout', { 
            state: { 
              deliveryDate, 
              deliveryTime, 
              giftWrap,
                grandTotal,
                selectedAddress
            } 
          })}
            disabled={!deliveryDate || !deliveryTime || !selectedAddress}
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2 ${
              !deliveryDate || !deliveryTime || !selectedAddress
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[var(--color-chocolate)] text-[var(--color-cream)] hover:bg-opacity-90'
          }`}
        >
          Checkout Your Treats
        </button>
        {(!deliveryDate || !deliveryTime) && (
          <p className="text-center text-xs text-red-500 mt-2">Please select delivery date and time</p>
        )}
      </div>
    </div>
  );
};
