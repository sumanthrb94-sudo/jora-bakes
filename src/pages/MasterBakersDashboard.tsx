import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChefHat, 
  Timer, 
  Flame, 
  Package, 
  Truck, 
  CheckCircle, 
  MoreVertical, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  AlertTriangle, 
  FileText,
  MousePointer2,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowRight,
  ClipboardList,
  Printer,
  X,
  RefreshCw,
  Warehouse
} from 'lucide-react';
import { subscribeToCollection, updateDocument, createDocument } from '../services/firestore';
import { Order, Product, ProductionStatus, AuditLog, Ingredient } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// --- Production State Config ---
const PRODUCTION_STATES: { id: ProductionStatus; label: string; icon: any; dot: string }[] = [
  { id: 'pending', label: 'Incoming', icon: ShoppingBag, dot: 'bg-[#C17A6B]' },
  { id: 'proving', label: 'Proving', icon: Timer, dot: 'bg-[#D26E4B]' },
  { id: 'oven', label: 'In Oven', icon: Flame, dot: 'bg-[#B85A3A]' },
  { id: 'cooling', label: 'Cooling/Pkg', icon: SnowflakeIcon, dot: 'bg-[#7A8B6E]' },
  { id: 'ready_for_collection', label: 'Ready', icon: CheckCircle, dot: 'bg-[#D4AF37]' }
];

function SnowflakeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>
    </svg>
  );
}

// --- Sub-Components ---

const AuditLogItem = ({ log }: { log: AuditLog }) => (
  <div className="flex items-start gap-3 py-3 border-l-2 border-[#E8E2D9] pl-6 relative">
    <div className="absolute -left-1.5 top-4 w-3 h-3 rounded-full bg-white border-2 border-[#D26E4B] shadow-sm shadow-[#D26E4B]/20" />
    <div className="flex-1">
      <p className="text-[11px] font-black text-[#1C1412] leading-tight uppercase italic tracking-tight">
        {log.userName} <span className="text-[#8B8680] font-bold lowercase opacity-60">transitioned to</span> {log.toStatus.replace('_', ' ')}
      </p>
      <p className="text-[9px] font-black text-[#8B8680] mt-1.5 uppercase tracking-widest opacity-40">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
    </div>
  </div>
);

const BakeSheetModal = ({ order, onClose }: { order: Order; onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[600] flex items-center justify-center p-6"
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      className="bg-[#FAF7F2] rounded-[3.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-[#E8E2D9]"
    >
      <div className="bg-[#1C1412] p-10 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <p className="text-[10px] font-black tracking-[0.4em] text-[#D26E4B] uppercase mb-1 italic">Manifest Extraction</p>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Bake Sheet.</h2>
          <p className="text-[10px] font-black tracking-widest opacity-40 mt-3 uppercase italic">Ledger Ref: PROD-{order.id.slice(-6).toUpperCase()}</p>
        </div>
        <button onClick={onClose} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all active:scale-90 border border-white/10 relative z-10">
          <X size={24} />
        </button>
      </div>
      <div className="p-10 max-h-[75vh] overflow-y-auto space-y-10 custom-scrollbar selection:bg-[#D26E4B] selection:text-white">
        <div className="grid grid-cols-1 gap-6">
          {order.items.map((item, i) => (
            <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-[#E8E2D9] shadow-sm group hover:border-[#D26E4B]/20 transition-all duration-500">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-[#1C1412] text-white rounded-[2rem] flex items-center justify-center text-2xl font-black italic shadow-xl shadow-black/20">
                  {item.quantity}x
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-[#1C1412] italic uppercase tracking-tighter leading-none">{item.product.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-[#D26E4B] uppercase tracking-[0.2em] bg-[#F9F1F0] px-3 py-1 rounded-full border border-[#D26E4B]/10">{item.variant?.flavor || item.product.weight}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t border-[#F5F0E8]">
                 <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.3em] mb-4 italic">Preparation Protocol</p>
                 <ul className="grid grid-cols-1 gap-3 italic font-bold">
                    {item.product.ingredients?.slice(0, 4).map((ing, j) => (
                      <li key={j} className="flex items-center gap-3 text-xs text-[#1C1412]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E8E2D9]" /> {ing}
                      </li>
                    ))}
                    <li className="flex items-center gap-3 text-xs text-[#D26E4B] bg-[#F9F1F0] p-4 rounded-2xl border border-[#D26E4B]/10">
                      <Clock size={16} /> <span className="uppercase tracking-[0.1em]">Target Flare: {item.product.bakeTime || '22 MIN @ 220°C'}</span>
                    </li>
                 </ul>
              </div>
            </div>
          ))}
        </div>

        {order.auditTrail && order.auditTrail.length > 0 && (
          <div className="pt-6 border-t border-gray-100">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Production Audit Trail</h4>
            <div className="space-y-1">
              {order.auditTrail.map((log, i) => (
                <div key={i}>
                  <AuditLogItem log={log} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// --- Core Modules ---

const ProductionFloor = ({ orders, user }: { orders: Order[]; user: any }) => {
  const [activeTab, setActiveTab] = useState<ProductionStatus>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => orders.filter(o => o.status === activeTab), [orders, activeTab]);

  const handleStatusChange = async (orderId: string, current: ProductionStatus, next: ProductionStatus) => {
    const auditLog: AuditLog = {
      id: Math.random().toString(36).slice(2, 11),
      timestamp: new Date().toISOString(),
      userId: user?.uid || 'system',
      userName: user?.name || 'Master Baker',
      fromStatus: current,
      toStatus: next,
      action: `Moved from ${current} to ${next}`
    };

    const order = orders.find(o => o.id === orderId);
    const existingTrail = order?.auditTrail || [];

    await updateDocument('orders', orderId, { 
      status: next,
      auditTrail: [...existingTrail, auditLog]
    });
    
    toast.success(`Moved order to ${next.replace('_', ' ')}`, {
      style: { background: '#1C1412', color: '#fff', fontWeight: 'bold' },
      icon: '🍞'
    });
  };

  const getNextStatus = (curr: ProductionStatus): ProductionStatus | null => {
    const sequence: ProductionStatus[] = ['pending', 'proving', 'oven', 'cooling', 'ready_for_collection'];
    const idx = sequence.indexOf(curr);
    return idx !== -1 && idx < sequence.length - 1 ? sequence[idx + 1] : null;
  };

  return (
    <div className="space-y-8">
      {/* State Selection */}
      <div className="flex gap-3 p-2 bg-white border border-[#E8E2D9] rounded-[3rem] overflow-x-auto no-scrollbar shadow-sm">
        {PRODUCTION_STATES.map(state => (
          <button
            key={state.id}
            onClick={() => setActiveTab(state.id)}
            className={`flex items-center gap-4 px-8 py-5 rounded-[2.5rem] transition-all shrink-0 ${activeTab === state.id ? 'bg-[#1C1412] text-white shadow-2xl shadow-black/30' : 'text-[#8B8680] hover:bg-[#FAF7F2]'}`}
          >
            <state.icon size={22} className={activeTab === state.id ? 'text-[#D26E4B]' : ''} />
            <div className="text-left">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] block leading-none opacity-40 mb-1 italic">Protocol</span>
              <span className="text-[13px] font-black tracking-tight uppercase italic">{state.label}</span>
            </div>
            {orders.filter(o => o.status === state.id).length > 0 && (
              <span className={`ml-4 px-3 py-1 rounded-full text-[10px] font-black italic ${activeTab === state.id ? 'bg-[#D26E4B] text-white' : 'bg-[#E8E2D9] text-[#1C1412]'}`}>
                {orders.filter(o => o.status === state.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map(order => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={order.id}
              className="bg-white rounded-[3rem] border border-[#E8E2D9] shadow-sm p-8 flex flex-col group hover:border-[#D26E4B]/40 hover:shadow-2xl hover:shadow-[#D26E4B]/5 transition-all duration-700 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FAF7F2] rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#D26E4B]/5 transition-colors" />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-[#D26E4B] tracking-[0.4em] uppercase italic">PROD-{order.id.slice(-6).toUpperCase()}</span>
                  <h3 className="text-2xl font-black text-[#1C1412] mt-2 italic uppercase tracking-tighter leading-none">{order.customer.name}</h3>
                  <div className="flex items-center gap-2 mt-3 text-[#B85A3A]">
                    <Clock size={16} className="opacity-60" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Log</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="p-4 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-[#1C1412] hover:bg-[#1C1412] hover:text-white hover:border-[#1C1412] transition-all duration-500 shadow-sm active:scale-90"
                >
                  <Layers size={22} className="stroke-[2.5]" />
                </button>
              </div>

              <div className="flex-1 space-y-4 mb-10 relative z-10">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#FAF7F2]/50 p-4 rounded-3xl border border-[#F5F0E8] group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border border-[#E8E2D9] text-[#1C1412] rounded-2xl flex items-center justify-center font-black text-xs shadow-sm group-hover:shadow-md transition-all italic">{item.quantity}x</div>
                      <span className="text-[13px] font-black text-[#1C1412] uppercase italic tracking-tight">{item.product.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {getNextStatus(order.status) && (
                <button 
                  onClick={() => handleStatusChange(order.id, order.status, getNextStatus(order.status)!)}
                  className="flex items-center justify-center gap-4 w-full py-6 bg-[#1C1412] text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-[11px] shadow-2xl shadow-black/20 active:scale-95 transition-all italic border border-white/5"
                >
                  Advance Flux <ArrowRight size={18} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="col-span-full py-24 text-center bg-[#FAF7F2] rounded-[4rem] border-2 border-dashed border-[#E8E2D9] flex flex-col items-center justify-center gap-6">
             <ChefHat size={64} className="text-[#D26E4B] opacity-10 animate-pulse" />
             <div className="space-y-2">
                <p className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.5em] italic">Floor Clearance Verified</p>
                <p className="text-sm font-bold text-[#1C1412] italic opacity-40">Operational stage {activeTab.replace(/_/g, ' ')} is manifest-free</p>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedOrder && <BakeSheetModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </AnimatePresence>
    </div>
  );
};

const DispatchLogistics = ({ orders }: { orders: Order[] }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const readyOrders = useMemo(() => orders.filter(o => o.status === 'ready_for_collection'), [orders]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkMove = async (to: ProductionStatus) => {
    const promises = selectedIds.map(id => updateDocument('orders', id, { status: to }));
    await Promise.all(promises);
    toast.success(`Bulk dispatched ${selectedIds.length} orders`, { icon: '🚚' });
    setSelectedIds([]);
  };

  const generateManifest = () => {
    toast.success("Manifest Generated! Printing 12 packing slips...", { duration: 4000 });
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end px-2">
        <div>
           <p className="text-[11px] font-black text-[#8B8680] uppercase tracking-[0.5em] mb-4 italic leading-none text-center md:text-left">Logistics Command Center</p>
           <h2 className="text-5xl font-black text-[#1C1412] tracking-tighter italic uppercase leading-none">Dispatch.</h2>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={generateManifest}
            className="flex items-center gap-4 px-10 py-6 bg-white border border-[#E8E2D9] text-[#1C1412] rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-sm hover:shadow-2xl hover:border-[#D26E4B]/30 transition-all duration-500 italic"
          >
            <Printer size={20} /> Manifest Sync
          </button>
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => handleBulkMove('out_for_delivery')}
            className={`flex items-center gap-4 px-10 py-6 bg-[#D26E4B] text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-[#D26E4B]/20 transition-all duration-500 italic border border-[#B85A3A]/50 ${selectedIds.length === 0 ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:bg-[#B85A3A] active:scale-95 hover:shadow-3xl'}`}
          >
            <Truck size={20} /> Authorize Fleet ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-[#E8E2D9] p-10 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-[#FAF7F2]/30 pointer-events-none" />
        <div className="grid grid-cols-1 gap-6 relative z-10">
          {readyOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => toggleSelect(order.id)}
              className={`p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer flex items-center justify-between group ${selectedIds.includes(order.id) ? 'bg-[#1C1412] border-[#1C1412] shadow-2xl shadow-black/40 text-white' : 'bg-[#FAF7F2]/50 border-[#E8E2D9] text-[#1C1412] hover:border-[#D26E4B]/30'}`}
            >
              <div className="flex items-center gap-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${selectedIds.includes(order.id) ? 'bg-[#D26E4B] text-white rotate-12' : 'bg-white border border-[#E8E2D9] shadow-sm'}`}>
                  {selectedIds.includes(order.id) ? <CheckCircle size={24} className="stroke-[3]" /> : <div className="w-6 h-6 rounded-lg border-2 border-[#E8E2D9] group-hover:border-[#D26E4B]/50 transition-colors" />}
                </div>
                <div>
                   <h4 className="font-black text-xl italic uppercase tracking-tighter leading-none mb-2">{order.customer.name}</h4>
                   <p className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${selectedIds.includes(order.id) ? 'text-[#D26E4B]' : 'text-[#8B8680]'}`}>
                    {order.address.label || 'Standard Hub'} • {order.items.length} Asset{order.items.length > 1 ? 's' : ''} • PROD-{order.id.slice(-4).toUpperCase()}
                   </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black tracking-tighter italic">Rs. {order.total}</p>
                <div className={`flex items-center justify-end gap-2 mt-2 italic font-black ${selectedIds.includes(order.id) ? 'text-[#D4AF37]' : 'text-[#B85A3A]'}`}>
                   <Truck size={14} />
                   <span className="text-[10px] uppercase tracking-widest">{order.deliverySlot} FLUX</span>
                </div>
              </div>
            </div>
          ))}
          {readyOrders.length === 0 && (
            <div className="py-24 text-center text-[#8B8680]/30 flex flex-col items-center justify-center gap-4">
               <Package size={64} className="opacity-10" />
               <p className="text-[11px] font-black uppercase tracking-[0.5em] italic">No Assets Awaiting Fleet Authorization</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PantryManagement = ({ products, ingredients }: { products: Product[]; ingredients: Ingredient[] }) => {
  const [activeMode, setActiveMode] = useState<'menu' | 'inventory'>('menu');

  const inventoryAlerts = ingredients.filter(i => i.currentStock <= i.threshold);

  const toggleSeasonal = async (product: Product) => {
    await updateDocument('products', product.id, { isSeasonal: !product.isSeasonal });
    toast.success(`Updated ${product.name} seasonal status`);
  };

  const updateProductStock = async (product: Product, status: boolean) => {
    await updateDocument('products', product.id, { isAvailable: status });
    toast.success(`${product.name} is now ${status ? 'In Stock' : 'Out of Stock'}`);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center px-2">
        <div className="flex gap-2 p-2 bg-white border border-[#E8E2D9] rounded-[2.5rem] shadow-sm">
           <button 
            onClick={() => setActiveMode('menu')}
            className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 italic ${activeMode === 'menu' ? 'bg-[#1C1412] text-white shadow-2xl shadow-black/20' : 'text-[#8B8680] hover:bg-[#FAF7F2]'}`}
           >
            Catalog Flux
           </button>
           <button 
            onClick={() => setActiveMode('inventory')}
            className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 italic ${activeMode === 'inventory' ? 'bg-[#1C1412] text-white shadow-2xl shadow-black/20' : 'text-[#8B8680] hover:bg-[#FAF7F2]'}`}
           >
            Dry Reserves
           </button>
        </div>
        
        {inventoryAlerts.length > 0 && (
          <div className="flex items-center gap-4 px-8 py-5 bg-[#F9F1F0] text-[#C17A6B] rounded-[2.5rem] border border-[#C17A6B]/20 shadow-sm animate-pulse italic">
            <AlertTriangle size={20} className="stroke-[3]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{inventoryAlerts.length} Critical Stock Depletion Alerts</span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeMode === 'menu' ? (
          <motion.div 
            key="menu" 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {products.map(product => (
              <div key={product.id} className="bg-white rounded-[3rem] p-8 border border-[#E8E2D9] shadow-sm relative overflow-hidden group hover:border-[#D26E4B]/30 hover:shadow-2xl hover:shadow-[#D26E4B]/5 transition-all duration-700">
                 {product.isSeasonal && (
                   <div className="absolute top-6 right-[-3rem] bg-[#D4AF37] text-[#1C1412] px-12 py-1.5 text-[8px] font-black uppercase tracking-widest rotate-45 shadow-xl border-y border-white/20 italic">
                     Seasonal
                   </div>
                 )}
                 
                 <div className="flex items-center gap-6 mb-8 relative z-10">
                    <div className="w-20 h-20 bg-[#FAF7F2] rounded-[2rem] overflow-hidden shadow-inner flex items-center justify-center text-[#E8E2D9] border border-[#E8E2D9]/50 group-hover:scale-105 transition-transform duration-700">
                       {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ChefHat size={32}/>}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h3 className="text-xl font-black text-[#1C1412] leading-tight italic uppercase tracking-tighter truncate">{product.name}</h3>
                       <p className="text-[9px] font-black text-[#8B8680] uppercase tracking-[0.3em] mt-2 italic opacity-60">{product.category.replace(/_/g, ' ')}</p>
                    </div>
                 </div>

                 <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between p-5 bg-[#FAF7F2] rounded-[2rem] border border-[#F5F0E8] group-hover:bg-white transition-colors duration-500">
                       <span className="text-[9px] font-black text-[#8B8680] uppercase tracking-[0.3em] italic">Vault Status</span>
                       <button 
                        onClick={() => updateProductStock(product, !product.isAvailable)}
                        className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all italic shadow-sm ${product.isAvailable ? 'bg-[#7A8B6E] text-white shadow-[#7A8B6E]/20' : 'bg-[#C17A6B] text-white shadow-[#C17A6B]/20'}`}
                       >
                        {product.isAvailable ? 'In Catalog' : 'Archived'}
                       </button>
                    </div>

                    <div className="flex gap-3">
                       <button 
                        onClick={() => toggleSeasonal(product)}
                        className={`flex-1 py-5 rounded-[1.8rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all border italic ${product.isSeasonal ? 'bg-[#FFF9F5] border-[#D4AF37]/30 text-[#D4AF37] shadow-sm' : 'bg-white border-[#E8E2D9] text-[#8B8680] hover:border-[#D26E4B]/40 hover:text-[#D26E4B]'}`}
                       >
                         {product.isSeasonal ? 'Remove Signature' : 'Mark Signature'}
                       </button>
                       <button className="p-5 bg-[#FAF7F2] text-[#1C1412] rounded-[1.8rem] border border-[#E8E2D9] hover:bg-[#1C1412] hover:text-white transition-all duration-500 active:scale-90">
                          <MoreVertical size={20} />
                       </button>
                    </div>
                 </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="inventory" 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-[4rem] border border-[#E8E2D9] p-12 shadow-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#FAF7F2]/20 pointer-events-none" />
            <table className="w-full relative z-10">
              <thead>
                <tr className="text-left border-b border-[#F5F0E8]">
                  <th className="pb-8 text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] px-6 italic">Raw Asset</th>
                  <th className="pb-8 text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] px-6 italic">Vault Count</th>
                  <th className="pb-8 text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] px-6 italic">Critical Mark</th>
                  <th className="pb-8 text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] px-6 italic text-center">Protocol</th>
                  <th className="pb-8 text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] px-6 italic text-right">Commit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5F0E8]">
                {ingredients.map(ing => (
                  <tr key={ing.id} className="group hover:bg-[#FAF7F2]/50 transition-all duration-500">
                    <td className="py-8 px-6">
                      <p className="font-black text-[#1C1412] text-lg italic uppercase tracking-tighter">{ing.name}</p>
                      <p className="text-[9px] font-black text-[#D26E4B] uppercase tracking-[0.2em] mt-1 italic">UID: {ing.id.toUpperCase()}</p>
                    </td>
                    <td className="py-8 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black tabular-nums text-[#1C1412] italic">{ing.currentStock}</span>
                        <span className="text-[10px] font-black text-[#8B8680] uppercase italic tracking-widest">{ing.unit}</span>
                      </div>
                    </td>
                    <td className="py-8 px-6 text-[11px] font-black text-[#8B8680] italic">{ing.threshold} {ing.unit} Limit</td>
                    <td className="py-8 px-6">
                      <div className="flex justify-center">
                        {ing.currentStock <= ing.threshold ? (
                          <span className="px-5 py-2 bg-[#F9F1F0] text-[#C17A6B] rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-[#C17A6B]/20 italic shadow-sm">Critical Warning</span>
                        ) : (
                          <span className="px-5 py-2 bg-[#F0F2EF] text-[#7A8B6E] rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-[#7A8B6E]/20 italic shadow-sm">Vault Normal</span>
                        )}
                      </div>
                    </td>
                    <td className="py-8 px-6">
                       <div className="flex justify-end">
                         <button className="w-12 h-12 bg-white border border-[#E8E2D9] rounded-2xl text-[#1C1412] hover:bg-[#1C1412] hover:text-white hover:border-[#1C1412] hover:shadow-xl transition-all duration-500 active:scale-90 flex items-center justify-center">
                            <Plus size={20} className="stroke-[2.5]" />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Dashboard Component ---

export const MasterBakersDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<'floor' | 'dispatch' | 'pantry'>('floor');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: 'rye-01', name: 'Rye Flour (Organic)', currentStock: 4, unit: 'kg', threshold: 10 },
    { id: 'wheat-01', name: 'Artisan Wheat Flour', currentStock: 45, unit: 'kg', threshold: 20 },
    { id: 'yeast-01', name: 'Fresh Starter Yeast', currentStock: 2, unit: 'kg', threshold: 5 },
    { id: 'salt-01', name: 'Maldon Sea Salt', currentStock: 12, unit: 'kg', threshold: 2 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubOrders = subscribeToCollection<Order>('orders', (data) => {
      setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    const unsubProducts = subscribeToCollection<Product>('products', (pData) => {
      setProducts(pData);
    });

    // Simulated ingredients sync (in a real app, this would be a Firestore collection)
    const unsubIngredients = subscribeToCollection<Ingredient>('ingredients', (iData) => {
        if (iData.length > 0) setIngredients(iData);
    });

    return () => { unsubOrders(); unsubProducts(); unsubIngredients(); };
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#FDFBF9] flex flex-col items-center justify-center">
        <div className="relative">
          <ChefHat size={64} className="text-[#1C1412] animate-bounce mb-8" />
          <div className="absolute inset-0 bg-white/20 blur-2xl -z-10 animate-pulse" />
        </div>
        <h2 className="text-sm font-black text-[#1C1412] uppercase tracking-[0.5em] animate-pulse">Preheating Command Center...</h2>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#FDFBF9] font-sans selection:bg-[#D4AF37] selection:text-[#1C1412] z-[500] overflow-y-auto overflow-x-hidden">
      <header className="px-8 pt-12 pb-12 bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-[#E8E2D9] flex flex-col md:flex-row md:items-center justify-between gap-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#D4AF37] via-[#D26E4B] to-[#1C1412]" />
        
        <div className="flex items-center gap-8 relative z-10">
          <button 
            onClick={() => navigate('/admin')}
            className="p-5 bg-white border border-[#E8E2D9] rounded-3xl hover:border-[#D26E4B]/50 hover:shadow-xl hover:shadow-[#D26E4B]/5 transition-all duration-500 text-[#1C1412] active:scale-90"
          >
            <ArrowRight className="rotate-180" size={24} />
          </button>
          <div className="w-20 h-20 bg-[#1C1412] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-black/40 group relative overflow-hidden border border-white/5">
             <ChefHat size={42} className="text-[#D4AF37] group-hover:scale-110 transition-transform duration-700" />
             <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </div>
          <div>
            <div className="flex items-center gap-4">
               <h1 className="text-4xl font-black text-[#1C1412] tracking-tighter italic uppercase leading-none">Master Baker.</h1>
               <div className="px-4 py-1.5 bg-[#FAF7F2] text-[#D26E4B] rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-[#D26E4B]/20 shadow-sm italic">PRO OPS SECURED</div>
            </div>
            <p className="text-[10px] font-black text-[#8B8680] uppercase tracking-[0.4em] mt-4 flex items-center gap-4 italic leading-none">
              <div className="w-2 h-2 bg-[#7A8B6E] rounded-full animate-pulse shadow-lg shadow-[#7A8B6E]/20" />
              Live Pulse: <span className="text-[#1C1412]">{orders.length} Active Manifests</span> • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <nav className="flex gap-3 p-1.5 bg-[#FAF7F2] rounded-[3rem] border border-[#E8E2D9] relative z-10 shadow-inner">
          {[
            { id: 'floor', label: 'Prod. Floor', icon: ClipboardList },
            { id: 'dispatch', label: 'Fleet Sync', icon: Truck },
            { id: 'pantry', label: 'Vault', icon: Warehouse }
          ].map(module => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id as any)}
              className={`flex items-center gap-4 px-10 py-5 rounded-[2.5rem] transition-all duration-700 font-black uppercase tracking-[0.3em] text-[10px] italic relative ${activeModule === module.id ? 'bg-[#1C1412] text-white shadow-2xl shadow-black/40' : 'text-[#8B8680] hover:bg-white hover:text-[#1C1412]'}`}
            >
              <module.icon size={20} className={activeModule === module.id ? 'text-[#D26E4B]' : 'opacity-40'} />
              {module.label}
              {activeModule === module.id && (
                <motion.div layoutId="nav-active" className="absolute inset-0 rounded-[2.5rem] border border-white/10 pointer-events-none" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1400px] mx-auto px-8 py-16 selection:bg-[#D26E4B] selection:text-white relative z-10">
        <AnimatePresence mode="wait">
          {activeModule === 'floor' && (
            <motion.div key="floor" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}>
              <ProductionFloor orders={orders} user={user} />
            </motion.div>
          )}
          {activeModule === 'dispatch' && (
            <motion.div key="dispatch" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}>
              <DispatchLogistics orders={orders} />
            </motion.div>
          )}
          {activeModule === 'pantry' && (
            <motion.div key="pantry" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6 }}>
              <PantryManagement products={products} ingredients={ingredients} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Subtle Flour-Dusted Overlay Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] grayscale -z-10 mix-blend-multiply overflow-hidden">
         <div className="absolute inset-0 scale-[2] rotate-12 bg-[url('https://www.transparenttextures.com/patterns/dust.png')]" />
      </div>
    </div>
  );
};
