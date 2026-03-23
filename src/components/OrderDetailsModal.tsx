import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../types';
import { X, Phone, MapPin, AlertCircle, Flame } from 'lucide-react';

export const STATUS_STEPS = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'cancelled_and_refunded'];

export const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:          { label: 'Pending',          color: 'bg-amber-50/50 text-amber-700 border-amber-100' },
  preparing:        { label: 'Order Confirmed',  color: 'bg-[#F2E8E4] text-[#D26E4B] border-[#E8E2D9]' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-[#EAE2F3] text-[#8E44AD] border-[#E8E2D9]' },
  delivered:        { label: 'Delivered',        color: 'bg-[#F0F2EF] text-[#7A8B6E] border-[#E8E2D9]' },
  cancelled:        { label: 'Cancelled',        color: 'bg-[#F9F1F0] text-[#C17A6B] border-[#E8E2D9]' },
  cancelled_and_refunded: { label: 'Refunded',   color: 'bg-gray-100 text-gray-500 border-gray-200 line-through' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const meta = STATUS_META[status] || { label: status, color: 'bg-gray-50 text-gray-400 border-gray-100' };
  return (
    <span className={`px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm ${meta.color}`}>
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
        className="absolute inset-0 bg-[#1C1412]/80 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div 
        className="w-[90%] sm:w-full min-w-[320px] max-w-lg bg-[#FAF7F2] rounded-[3rem] shadow-2xl relative z-[10000] overflow-y-auto shrink-0 flex flex-col border border-white/20"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
         {/* Header */}
         <div className="p-8 border-b border-[#E8E2D9] flex items-center justify-between sticky top-0 bg-[#FAF7F2]/95 backdrop-blur-md z-10 w-full">
            <div>
               <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-2 italic">Official Record</p>
               <h2 className="text-3xl font-black text-[#1C1412] uppercase tracking-tighter italic">#{order.id?.slice(-6).toUpperCase() || 'SYS'}</h2>
            </div>
            <button onClick={onClose} className="w-12 h-12 bg-white border border-[#E8E2D9] rounded-2xl flex items-center justify-center text-[#1C1412] hover:bg-[#F2E8E4] transition-all shadow-sm">
               <X size={20} />
            </button>
         </div>

         {/* Content Body */}
         <div className="p-8 space-y-10 w-full block">
            {/* Customer Info */}
            <div className="space-y-6">
               <h3 className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic leading-none">Customer Profile</h3>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white border border-[#E8E2D9] p-5 rounded-[2rem] flex items-center gap-4 shadow-sm group">
                     <div className="w-10 h-10 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#D26E4B] group-hover:bg-[#F2E8E4] transition-colors">
                        <Phone size={18} />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-[#8B8680] uppercase tracking-widest mb-1">Contact</span>
                        <span className="text-[15px] font-black text-[#1C1412] tracking-tight">{order.customer?.phone || 'No phone provided'}</span>
                     </div>
                  </div>
                  
                  <div className="bg-white border border-[#E8E2D9] p-5 rounded-[2rem] flex items-start gap-4 shadow-sm group">
                     <div className="w-10 h-10 bg-[#FAF7F2] rounded-2xl flex items-center justify-center text-[#D26E4B] group-hover:bg-[#F2E8E4] transition-colors shrink-0">
                        <MapPin size={18} />
                     </div>
                     <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-[#8B8680] uppercase tracking-widest mb-1">Destination</span>
                        <span className="text-[15px] font-black text-[#1C1412] tracking-tight leading-snug">{order.address?.street || 'No Address'}</span>
                        {order.address?.label && <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mt-2 block">Tag: {order.address.label}</span>}
                     </div>
                  </div>
                  
                  {order.address?.instructions && (
                    <div className="bg-[#FFF9F5] border border-[#D26E4B]/20 p-6 rounded-[2rem] flex items-start gap-4 shadow-sm shadow-[#D26E4B]/5 group">
                       <div className="w-10 h-10 bg-white border border-[#D26E4B]/10 rounded-2xl flex items-center justify-center text-[#D26E4B] group-hover:scale-110 transition-transform shrink-0">
                          <AlertCircle size={20} />
                       </div>
                       <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-[#D26E4B] uppercase tracking-[0.3em] block mb-2 italic">Chef / Delivery Directives</span>
                          <span className="text-sm font-bold text-[#1C1412] leading-relaxed italic">{order.address.instructions}</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            {/* Items Summary */}
            <div className="space-y-6">
               <h3 className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Itemization</h3>
               <div className="space-y-4">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="p-6 bg-white rounded-[2rem] border border-[#E8E2D9] shadow-sm hover:border-[#D26E4B]/30 transition-all group block">
                       <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 min-w-0">
                             <div className="w-10 h-10 shrink-0 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex items-center justify-center font-black text-xs text-[#1C1412] group-hover:bg-[#D26E4B] group-hover:text-white transition-all">{item.quantity || 1}x</div>
                             <div className="flex flex-col min-w-0 pt-0.5">
                                <span className="text-[15px] font-black text-[#1C1412] tracking-tight break-words uppercase italic">{item.product?.name || 'Unknown Item'}</span>
                                {item.variant && <span className="text-[10px] font-bold text-[#D26E4B] capitalize tracking-wider mt-1">{item.variant.flavor} • {item.variant.weight}</span>}
                             </div>
                          </div>
                          <span className="font-black text-sm text-[#1C1412] shrink-0 pt-1.5 italic">Rs. {Number(item.product?.price || 0) * (item.quantity || 1)}</span>
                       </div>
                       
                       {item.specialRequest && (
                         <div className="mt-4 bg-[#F2E8E4]/50 border border-[#D26E4B]/10 rounded-2xl p-4 flex gap-3">
                           <Flame size={16} className="text-[#D26E4B] shrink-0 mt-0.5" />
                           <div className="min-w-0">
                             <span className="text-[9px] font-black text-[#D26E4B] uppercase tracking-[0.2em] block mb-1 italic">Special Request</span>
                             <span className="text-xs font-bold text-[#1C1412] italic">{item.specialRequest}</span>
                           </div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
            </div>

            {/* Status Management */}
            <div className="space-y-6">
               <h3 className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Logistics Control</h3>
               <div className="grid grid-cols-2 gap-3">
                  {STATUS_STEPS.map((step) => (
                    <button
                      key={step}
                      onClick={() => onUpdateStatus(order.id, step)}
                      className={`p-4 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 group ${
                        order.status === step 
                          ? 'bg-[#1C1412] border-[#1C1412] text-white shadow-xl shadow-black/20 ring-2 ring-offset-2 ring-[#1C1412]' 
                          : 'bg-white border-[#E8E2D9] text-[#8B8680] hover:border-[#D26E4B] hover:text-[#D26E4B] shadow-sm'
                      }`}
                    >
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] block">{STATUS_META[step]?.label || step.replace('_', ' ')}</span>
                       {order.status === step && <div className="w-1.5 h-1.5 bg-[#D26E4B] rounded-full group-hover:scale-150 transition-transform" />}
                    </button>
                  ))}
               </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-[#FAF7F2] p-8 rounded-[3rem] border border-[#E8E2D9] space-y-6 w-full shadow-inner">
               <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-[#E8E2D9] shadow-sm">
                  <span className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.2em]">Settlement Method</span>
                  <span className="px-3 py-1.5 bg-[#1C1412] rounded-xl text-[9px] font-black text-[#D4AF37] uppercase tracking-[0.2em] shadow-lg">
                    {order.paymentMethod || 'CASH'}
                  </span>
               </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] ml-2 italic">Payment Audit</p>
                   <div className="grid grid-cols-3 gap-2">
                      {(['pending', 'paid', 'failed'] as const).map(pstatus => (
                         <button
                            key={pstatus}
                            onClick={() => onUpdatePaymentStatus(order.id, pstatus)}
                            className={`py-3 rounded-2xl border text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                               order.paymentStatus === pstatus
                                  ? pstatus === 'paid' ? 'bg-[#7A8B6E] border-[#7A8B6E] text-white shadow-[#7A8B6E]/20 shadow-lg' :
                                    pstatus === 'failed' ? 'bg-[#C17A6B] border-[#C17A6B] text-white shadow-[#C17A6B]/20 shadow-lg' :
                                    'bg-[#D4AF37] border-[#D4AF37] text-white shadow-[#D4AF37]/20 shadow-lg'
                                  : 'bg-white border-[#E8E2D9] text-[#8B8680] hover:border-[#D26E4B]/30'
                            }`}
                         >
                            {pstatus}
                         </button>
                      ))}
                   </div>
                </div>

               <div className="space-y-4 pt-2">
                  <div className="flex justify-between text-[11px] font-black text-[#8B8680] uppercase tracking-widest">
                     <span>Base Subtotal</span>
                     <span className="text-[#1C1412]">Rs. {order.total}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-black text-[#8B8680] uppercase tracking-widest">
                     <span>Logistics Fee</span>
                     <span className="text-[#7A8B6E]">Complimentary</span>
                  </div>

                  <div className="border-t border-[#E8E2D9] mt-6 pt-6 flex justify-between items-center">
                     <span className="text-[11px] font-black text-[#1C1412] uppercase tracking-[0.4em] italic">Gross Settlement</span>
                     <span className="text-3xl font-black text-[#1C1412] tracking-tighter italic">Rs. {order.total}</span>
                  </div>
               </div>
            </div>

            <button
               onClick={onClose}
               className="w-full py-6 bg-[#1C1412] text-white text-[11px] font-black uppercase tracking-[0.4em] rounded-[2.5rem] shadow-2xl shadow-black/30 active:scale-95 transition-all hover:bg-[#2D2422]"
            >
               Authorize & Close
            </button>
         </div>
      </div>
    </div>,
    getPortalTarget()
  );
};
