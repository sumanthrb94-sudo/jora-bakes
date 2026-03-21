import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, Trash2, Home, Briefcase, Gift, ArrowLeft, Navigation } from 'lucide-react';
import { Address } from '../types'; // Ensure Address is imported from types.ts
import toast from 'react-hot-toast';

export const SavedAddresses = () => {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    label: 'Home',
    street: '',
    city: '',
    pincode: '',
    instructions: ''
  });
  const [isLocating, setIsLocating] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        if (!response.ok) throw new Error('Failed to fetch address');
        const data = await response.json();
        
        const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state_district || '';
        const pincode = data.address?.postcode || '';
        const streetName = data.address?.road || data.address?.suburb || (data.display_name ? data.display_name.split(',')[0] : '');
        
        setNewAddress(prev => ({
          ...prev,
          street: streetName,
          city: city,
          pincode: pincode
        }));
        toast.success("Location found!", { icon: '📍' });
      } catch (error) {
        console.error("Geocoding error:", error);
        toast.error("Could not determine address from location.");
      } finally {
        setIsLocating(false);
      }
    }, (error) => {
      console.error("Geolocation error:", error);
      toast.error('Unable to retrieve location. Check permissions.');
      setIsLocating(false);
    }, { timeout: 10000, maximumAge: 0 });
  };

  const addresses = profile?.addresses || [];

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city || !newAddress.pincode) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const addressToAdd: Address = {
        id: Math.random().toString(36).substr(2, 9),
        label: newAddress.label as Address['label'],
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
    } catch (err: unknown) {
      const error = err as any;
      console.error("Failed to save address:", error);
      toast.error(error.message?.includes('permission') ? "Permission denied. Check Rules!" : "Failed to save address");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    await updateProfile({ addresses: updatedAddresses });
    toast.success('Address removed');
  };

  const handleSelectAddress = async (id: string) => {
    const selectedIdx = addresses.findIndex(addr => addr.id === id);
    if (selectedIdx > 0) {
      const updatedAddresses = [...addresses];
      const selected = updatedAddresses.splice(selectedIdx, 1)[0];
      updatedAddresses.unshift(selected); // Move to top to make it default
      // Optionally show a loading spinner, but we want it to feel instant
      updateProfile({ addresses: updatedAddresses }).catch(err => console.error("Failed to set default address", err));
    }
    // Navigate back to cart or profile immediately
    navigate(-1);
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
    <div className="min-h-screen bg-[#f7f5f0] pb-32">
      {/* Swiggy Style Sticky Header */}
      <div className="bg-white sticky top-0 z-30 shadow-sm px-4 py-3 flex items-center gap-3 pt-safe">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-[var(--color-chocolate)] hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-black text-lg text-[var(--color-chocolate)] tracking-tight leading-none">Saved Addresses</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Manage Locations</p>
        </div>
      </div>

      <div className="p-3 space-y-3">
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
                  {addresses.map((addr, index) => (
                    <motion.div
                      key={addr.id}
                      layout
                      onClick={() => handleSelectAddress(addr.id)}
                      className={`bg-white rounded-2xl p-4 shadow-sm border flex justify-between items-start cursor-pointer transition-colors group ${
                        index === 0 ? 'border-[var(--color-terracotta)] ring-1 ring-[var(--color-terracotta)]' : 'border-gray-100 hover:border-[var(--color-terracotta)]'
                      }`}
                    >
                      <div className="flex gap-4 w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          index === 0 ? 'bg-orange-50 text-[var(--color-terracotta)]' : 'bg-gray-50 text-gray-500 group-hover:bg-orange-50 group-hover:text-[var(--color-terracotta)]'
                        }`}>
                          {getLabelIcon(addr.label)}
                        </div>
                        <div className="flex-1 pr-2">
                          <h4 className="font-bold text-sm text-[var(--color-chocolate)] flex items-center gap-2">
                            {addr.label}
                            {index === 0 && <span className="bg-orange-50 text-[var(--color-terracotta)] text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">Default</span>}
                          </h4>
                          <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{addr.street}</p>
                          <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{addr.city} • {addr.pincode}</p>
                          {addr.instructions && (
                            <p className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500 mt-2 font-medium">Note: {addr.instructions}</p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(addr.id);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[var(--color-terracotta)] bg-white font-bold text-sm flex items-center justify-center gap-2 hover:border-[var(--color-terracotta)] hover:bg-orange-50 transition-all shadow-sm"
                  >
                    <Plus size={18} strokeWidth={2.5} /> Add New Address
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
              className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100"
            >
              <h3 className="text-sm font-black text-[var(--color-chocolate)] uppercase tracking-wider mb-5">Add New Address</h3>
              
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={isLocating}
                className="w-full mb-6 bg-orange-50 text-[var(--color-terracotta)] py-3.5 rounded-xl font-bold text-sm border border-orange-100/50 hover:bg-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
              >
                {isLocating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[var(--color-terracotta)] border-t-transparent rounded-full animate-spin" />
                    Locating...
                  </>
                ) : (
                  <>
                    <Navigation size={18} />
                    Use Current Location
                  </>
                )}
              </button>

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Save address as</label>
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Gift', 'Other'].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setNewAddress({ ...newAddress, label: l as any })}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                          newAddress.label === l 
                            ? 'bg-orange-50 border-[var(--color-terracotta)] text-[var(--color-terracotta)]' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {getLabelIcon(l)}
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Complete Address</label>
                  <input 
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    placeholder="House No, Building, Street"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-2 block">City</label>
                    <input 
                      type="text"
                      required
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="City"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-2 block">Pincode</label>
                    <input 
                      type="text"
                      required
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      placeholder="6-digit PIN"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Delivery Instructions</label>
                  <textarea 
                    value={newAddress.instructions}
                    onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                    placeholder="E.g. Ring the bell, Leave at gate"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-terracotta)] shadow-sm h-20 resize-none placeholder:font-medium"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--color-terracotta)] shadow-md hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Save Address'
                    )}
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
