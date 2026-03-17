import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Trash2, Home, Briefcase, Gift, ArrowLeft, Check } from 'lucide-react';
import { Address } from '../types'; // Ensure Address is imported from types.ts
import toast from 'react-hot-toast';

export const SavedAddresses = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    label: 'Home',
    street: '',
    city: '',
    pincode: '',
    instructions: ''
  });

  const addresses = profile?.addresses || [];

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    const addressToAdd: Address = {
      id: Math.random().toString(36).substr(2, 9),
      label: newAddress.label as any,
      street: newAddress.street!,
      city: newAddress.city!,
      pincode: newAddress.pincode!,
      instructions: newAddress.instructions
    };

    const updatedAddresses = [...addresses, addressToAdd];
    await updateProfile({ addresses: updatedAddresses });
    setIsAdding(false);
    setNewAddress({ label: 'Home', street: '', city: '', pincode: '', instructions: '' });
    toast.success('Address added successfully');
  };

  const handleDeleteAddress = async (id: string) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    await updateProfile({ addresses: updatedAddresses });
    toast.success('Address removed');
  };

  const getLabelIcon = (label: string) => {
    switch (label) {
      case 'Home': return <Home size={18} />;
      case 'Office': return <Briefcase size={18} />;
      case 'Gift': return <Gift size={18} />;
      default: return <MapPin size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-beige)] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/profile')} className="p-2 bg-gray-50 rounded-full text-[var(--color-chocolate)]">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-script text-3xl text-[var(--color-terracotta)]">Saved Addresses</h1>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {!isAdding ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {addresses.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
                  <div className="w-20 h-20 bg-[var(--color-beige)] rounded-full flex items-center justify-center text-[var(--color-terracotta)] mx-auto mb-6">
                    <MapPin size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-chocolate)] mb-2">No addresses yet</h3>
                  <p className="text-gray-500 text-sm mb-6">Save your home, office, or a friend's address for quicker checkout.</p>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-[var(--color-terracotta)] text-white px-8 py-3 rounded-full font-bold shadow-md flex items-center gap-2 mx-auto"
                  >
                    <Plus size={20} /> Add Address
                  </button>
                </div>
              ) : (
                <>
                  {addresses.map((addr) => (
                    <motion.div
                      key={addr.id}
                      layout
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-start"
                    >
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-beige)] flex items-center justify-center text-[var(--color-terracotta)] shrink-0">
                          {getLabelIcon(addr.label)}
                        </div>
                        <div>
                          <h4 className="font-bold text-[var(--color-chocolate)]">{addr.label}</h4>
                          <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                          <p className="text-xs text-gray-400">{addr.city} - {addr.pincode}</p>
                          {addr.instructions && (
                            <p className="text-[10px] text-[var(--color-sage)] mt-2 italic">"{addr.instructions}"</p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-[var(--color-terracotta)] hover:text-[var(--color-terracotta)] transition-all"
                  >
                    <Plus size={20} /> Add New Address
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-[var(--color-chocolate)] mb-6">New Address</h3>
              <form onSubmit={handleAddAddress} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Label</label>
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Gift', 'Other'].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, label: l as any })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                          newAddress.label === l 
                            ? 'bg-[var(--color-terracotta)] border-[var(--color-terracotta)] text-white' 
                            : 'border-gray-100 text-gray-500'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Street Address</label>
                  <input 
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="House No, Building, Street"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">City</label>
                    <input 
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Pincode</label>
                    <input 
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      placeholder="6-digit PIN"
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Delivery Instructions (Optional)</label>
                  <textarea 
                    value={newAddress.instructions}
                    onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                    placeholder="E.g. Ring the bell, Leave at gate"
                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--color-terracotta)] h-20 resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-2xl font-bold text-gray-500 bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 rounded-2xl font-bold text-white bg-[var(--color-terracotta)] shadow-lg"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
