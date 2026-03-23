import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../types';
import { X, Phone, MapPin, AlertCircle, Flame } from 'lucide-react';

export const STATUS_STEPS = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'cancelled_and_refunded'];

export const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Pending',          color: 'bg-amber-50 text-amber-600 border-amber-100' },
  preparing:        { label: 'Order Confirmed',  color: 'bg-blue-50 text-blue-600 border-blue-100' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  delivered:        { label: 'Delivered',        color: 'bg-green-50 text-green-700 border-green-100' },
  cancelled:        { label: 'Cancelled',        color: 'bg-red-50 text-red-600 border-red-100' },
  cancelled_and_refunded: { label: 'Refunded',   color: 'bg-gray-100 text-gray-500 border-gray-200 line-through' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const meta = STATUS_META[status] || { label: status, color: 'bg-gray-50 text-gray-400 border-gray-100' };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${meta.color}`}>
      {meta.label}
    </span>
  );
};

export const OrderDetailsModal = ({ 
  order, 
  onClose, 
  onUpdateStatus, 
  onUpdatePaymentStatus
}: { 
  order: Order | null, 
  onClose: () => void, 
  onUpdateStatus: (id: string, s: string) => void, 
  onUpdatePaymentStatus: (id: string, s: 'pending' | 'paid' | 'failed') => void
}) => {
  if (!order) return null;

  const getPortalTarget = () => document.getElementById('modal-root') || document.body;

  return createPortal(
    <div className="absolute inset-0 w-full h-full flex items-center justify-center p-4 pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1C1412]/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div 
        className="w-[90%] sm:w-full min-w-[320px] max-w-lg bg-white rounded-3xl shadow-2xl relative z-[10000] overflow-y-auto shrink-0 flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
         {/* Header */}
         <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 w-full">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Order Details</p>
               <h2 className="text-2xl font-black text-[#1D1D1F] uppercase tracking-tight italic">#{order.id?.slice(-6).toUpperCase() || 'SYS'}</h2>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
               <X size={20} />
            </button>
         </div>

         {/* Content Body */}
         <div className="p-6 space-y-8 w-full block">
            {/* Customer Info */}
            <div className="space-y-4">
               <h3 className="text-base font-black text-[#1D1D1F] leading-none">Customer Info</h3>
               <p className="text-xs font-bold text-gray-400 mb-3">ID: {order.userId?.slice(-8) || 'GUEST'}</p>
               
               <div className="grid grid-cols-1 gap-3">
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
                     <Phone size={16} className="text-gray-400 shrink-0" />
                     <span className="text-sm font-bold text-gray-800 break-words">{order.customer?.phone || 'No phone provided'}</span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl flex items-start gap-3">
                     <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                     <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-800 break-words">{order.address?.street || 'No Address'}</span>
                        {order.address?.label && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Label: {order.address.label}</span>}
                     </div>
                  </div>
                  
                  {order.address?.instructions && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                       <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                       <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-1">Delivery / Cook Notes</span>
                          <span className="text-sm font-bold text-amber-900 break-words whitespace-pre-wrap">{order.address.instructions}</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Itemization ({order.items?.length || 0})</h3>
               <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 block">
                       <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                             <div className="w-8 h-8 shrink-0 bg-white rounded-lg border border-gray-100 flex items-center justify-center font-black text-xs text-gray-800">{item.quantity || 1}x</div>
                             <div className="flex flex-col min-w-0">
                                <span className="text-sm font-black text-gray-800 tracking-tight break-words">{item.product?.name || 'Unknown Item'}</span>
                                {item.variant && <span className="text-[10px] font-bold text-gray-500 capitalize break-words">{item.variant.flavor} ({item.variant.weight})</span>}
                             </div>
                          </div>
                          <span className="font-black text-sm text-gray-800 shrink-0">Rs. {Number(item.product?.price || 0) * (item.quantity || 1)}</span>
                       </div>
                       
                       {item.specialRequest && (
                         <div className="mt-3 bg-amber-100/50 border border-amber-100 rounded-xl p-3 flex gap-2">
                           <Flame size={14} className="text-amber-500 shrink-0" />
                           <div className="min-w-0">
                             <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Special Request</span>
                             <span className="text-xs font-bold text-amber-900 break-words whitespace-pre-wrap">{item.specialRequest}</span>
                           </div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Status Management */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Update Status</h3>
               <div className="grid grid-cols-2 gap-2">
                  {STATUS_STEPS.map((step) => (
                    <button
                      key={step}
                      onClick={() => onUpdateStatus(order.id, step)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                        order.status === step 
                          ? 'bg-[#1D1D1F] border-[#1D1D1F] text-white shadow-md ring-1 ring-offset-1 ring-[#1D1D1F]' 
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                       <span className="text-[9px] font-black uppercase tracking-widest block">{STATUS_META[step]?.label || step.replace('_', ' ')}</span>
                       {order.status === step && <div className="w-1 h-1 bg-white rounded-full mt-0.5" />}
                    </button>
                  ))}
               </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 p-6 rounded-2xl space-y-4 w-full">
               <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Mode</span>
                  <span className="px-2 py-1 bg-[#1D1D1F] rounded text-[9px] font-black text-white uppercase tracking-widest">
                    {order.paymentMethod || 'CASH'}
                  </span>
               </div>

                <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] ml-1">Update Payment Status</p>
                   <div className="grid grid-cols-3 gap-2">
                      {(['pending', 'paid', 'failed'] as const).map(pstatus => (
                         <button
                            key={pstatus}
                            onClick={() => onUpdatePaymentStatus(order.id, pstatus)}
                            className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                               order.paymentStatus === pstatus
                                  ? pstatus === 'paid' ? 'bg-green-600 border-green-600 text-white' :
                                    pstatus === 'failed' ? 'bg-red-600 border-red-600 text-white' :
                                    'bg-amber-500 border-amber-500 text-white'
                                  : 'bg-white border-gray-100 text-gray-400'
                            }`}
                         >
                            {pstatus}
                         </button>
                      ))}
                   </div>
                </div>

               <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Subtotal</span>
                  <span>Rs. {order.total}</span>
               </div>
               <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Delivery</span>
                  <span className="text-green-600 font-black tracking-wide uppercase text-[10px]">Free</span>
               </div>

               <div className="border-t border-dashed border-gray-300 my-2 pt-3 flex justify-between items-center">
                  <span className="text-xs font-black text-[#1D1D1F] uppercase tracking-widest">Grand Total</span>
                  <span className="text-lg font-black text-[#1D1D1F] tracking-tighter">Rs. {order.total}</span>
               </div>
            </div>
            <div className="flex gap-3 w-full">
               <button
                  onClick={onClose}
                  className="flex-1 w-full py-4 bg-[#1D1D1F] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-opacity"
               >
                  Dismiss Details
               </button>
            </div>
         </div>
      </div>
    </div>,
    getPortalTarget()
  );
};
