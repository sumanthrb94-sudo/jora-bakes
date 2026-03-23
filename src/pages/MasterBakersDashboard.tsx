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
const PRODUCTION_STATES: { id: ProductionStatus; label: string; icon: any; color: string }[] = [
  { id: 'pending', label: 'Incoming', icon: ShoppingBag, color: 'text-blue-500 bg-blue-50' },
  { id: 'proving', label: 'Proving', icon: Timer, color: 'text-orange-500 bg-orange-50' },
  { id: 'oven', label: 'In Oven', icon: Flame, color: 'text-red-500 bg-red-50' },
  { id: 'cooling', label: 'Cooling/Pkg', icon: SnowflakeIcon, color: 'text-cyan-500 bg-cyan-50' },
  { id: 'ready_for_collection', label: 'Ready', icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50' }
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
  <div className="flex items-start gap-3 py-2 border-l-2 border-gray-100 pl-4 relative">
    <div className="absolute -left-1.5 top-3 w-3 h-3 rounded-full bg-white border-2 border-[#70011C]" />
    <div className="flex-1">
      <p className="text-[11px] font-black text-gray-900 leading-none">
        {log.userName} <span className="text-gray-400 font-medium">transitioned to</span> {log.toStatus.replace('_', ' ')}
      </p>
      <p className="text-[9px] font-bold text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
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
      className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl"
    >
      <div className="bg-[#1C1412] p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Bake Sheet</h2>
          <p className="text-[10px] font-black tracking-widest opacity-50">Order #{order.id.slice(-6).toUpperCase()}</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all">
          <X size={24} />
        </button>
      </div>
      <div className="p-8 max-h-[70vh] overflow-y-auto space-y-8 custom-scrollbar">
        <div className="grid grid-cols-2 gap-6">
          {order.items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#70011C] text-white rounded-2xl flex items-center justify-center text-xl font-black">
                  {item.quantity}x
                </div>
                <div>
                  <h3 className="font-black text-gray-900">{item.product.name}</h3>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.variant?.flavor || item.product.weight}</span>
                </div>
              </div>
              <div className="space-y-2">
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Recipe Notes</p>
                 <ul className="text-xs font-bold text-gray-600 space-y-1.5 list-disc pl-4">
                    {item.product.ingredients?.slice(0, 4).map((ing, j) => <li key={j}>{ing}</li>)}
                    <li className="text-[#a16207]">Bake Time: {item.product.bakeTime || '22 mins @ 220°C'}</li>
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
      <div className="flex gap-2 p-1 bg-white border border-gray-100 rounded-[2.5rem] overflow-x-auto no-scrollbar shadow-sm">
        {PRODUCTION_STATES.map(state => (
          <button
            key={state.id}
            onClick={() => setActiveTab(state.id)}
            className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] transition-all shrink-0 ${activeTab === state.id ? 'bg-[#1C1412] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <state.icon size={20} className={activeTab === state.id ? 'text-[#D4AF37]' : ''} />
            <div className="text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block leading-none opacity-50">Stage</span>
              <span className="text-sm font-black tracking-tight">{state.label}</span>
            </div>
            {orders.filter(o => o.status === state.id).length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === state.id ? 'bg-white/10' : 'bg-gray-100'}`}>
                {orders.filter(o => o.status === state.id).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map(order => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={order.id}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6 flex flex-col group hover:shadow-xl hover:shadow-gray-200/50 transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">PROD-{order.id.slice(-6).toUpperCase()}</span>
                  <h3 className="text-xl font-black text-gray-950 mt-1">{order.customer.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[#D4AF37]">
                    <Clock size={12} className="opacity-70" />
                    <span className="text-[11px] font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOrder(order)}
                  className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:bg-[#1C1412] hover:text-white transition-all"
                >
                  <Layers size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-3 mb-8">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-2xl border border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white border border-gray-100 text-gray-950 rounded-lg flex items-center justify-center font-black text-xs">{item.quantity}x</div>
                      <span className="text-xs font-black text-gray-600">{item.product.name}</span>
                    </div>
                  </div>
                ))}
              </div>

              {getNextStatus(order.status) && (
                <button 
                  onClick={() => handleStatusChange(order.id, order.status, getNextStatus(order.status)!)}
                  className="flex items-center justify-center gap-3 w-full py-5 bg-[#1C1412] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-black/10 active:scale-95 transition-all"
                >
                  Advance to {getNextStatus(order.status)!.replace('_', ' ')} <ArrowRight size={16} />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
             <ChefHat size={48} className="mx-auto text-gray-200 mb-4" />
             <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Floor Clear in {activeTab.replace('_', ' ')}</p>
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
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-950 tracking-tighter italic uppercase">Pre-Dawn Dispatch</h2>
          <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">Logistics Command Center</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={generateManifest}
            className="flex items-center gap-3 px-8 py-5 bg-white border border-gray-100 text-gray-950 rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-lg transition-all"
          >
            <Printer size={18} /> Manifest Generator
          </button>
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => handleBulkMove('out_for_delivery')}
            className={`flex items-center gap-3 px-8 py-5 bg-[#70011C] text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-red-900/10 transition-all ${selectedIds.length === 0 ? 'opacity-30' : 'hover:scale-105 active:scale-95'}`}
          >
            <Truck size={18} /> Dispatched Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
        <div className="grid grid-cols-1 gap-4">
          {readyOrders.map(order => (
            <div 
              key={order.id} 
              onClick={() => toggleSelect(order.id)}
              className={`p-6 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between ${selectedIds.includes(order.id) ? 'bg-[#70011C] border-[#70011C] shadow-lg text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedIds.includes(order.id) ? 'bg-white/10' : 'bg-white'}`}>
                  {selectedIds.includes(order.id) ? <CheckCircle size={20} /> : <div className="w-5 h-5 rounded border-2 border-gray-200" />}
                </div>
                <div>
                   <h4 className="font-black text-lg">{order.customer.name}</h4>
                   <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedIds.includes(order.id) ? 'opacity-60' : 'text-gray-400'}`}>
                    {order.address.label || 'Home'} • {order.items.length} Items • #{order.id.slice(-4).toUpperCase()}
                   </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black tracking-tighter">Rs. {order.total}</p>
                <div className={`flex items-center justify-end gap-1.5 mt-1 ${selectedIds.includes(order.id) ? 'opacity-70' : 'text-[#D4AF37]'}`}>
                   <Truck size={12} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{order.deliverySlot}</span>
                </div>
              </div>
            </div>
          ))}
          {readyOrders.length === 0 && (
            <div className="py-20 text-center text-gray-300">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p className="text-sm font-black uppercase tracking-[0.2em]">No Items Awaiting Dispatch</p>
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex gap-4 p-1 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
           <button 
            onClick={() => setActiveMode('menu')}
            className={`px-8 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'menu' ? 'bg-[#1C1412] text-white shadow-lg' : 'text-gray-400'}`}
           >
            Bake List
           </button>
           <button 
            onClick={() => setActiveMode('inventory')}
            className={`px-8 py-4 rounded-[1.8rem] text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'inventory' ? 'bg-[#1C1412] text-white shadow-lg' : 'text-gray-400'}`}
           >
            Dry Store
           </button>
        </div>
        
        {inventoryAlerts.length > 0 && (
          <div className="flex items-center gap-3 px-6 py-4 bg-red-50 text-red-600 rounded-[2rem] border border-red-100 animate-pulse">
            <AlertTriangle size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">{inventoryAlerts.length} Critical Stock Levels</span>
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
              <div key={product.id} className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm relative overflow-hidden group">
                 {product.isSeasonal && <div className="absolute top-4 right-[-2.5rem] bg-[#D4AF37] text-[#1C1412] px-10 py-1 text-[8px] font-black uppercase tracking-widest rotate-45 shadow-sm">Seasonal</div>}
                 
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gray-100 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center text-gray-300">
                       {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <ChefHat size={28}/>}
                    </div>
                    <div className="flex-1">
                       <h3 className="text-lg font-black text-gray-950 leading-tight">{product.name}</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{product.category}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50">
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Storefront Status</span>
                       <button 
                        onClick={() => updateProductStock(product, !product.isAvailable)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${product.isAvailable ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
                       >
                        {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                       </button>
                    </div>

                    <div className="flex gap-2">
                       <button 
                        onClick={() => toggleSeasonal(product)}
                        className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${product.isSeasonal ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-100 text-gray-400'}`}
                       >
                         {product.isSeasonal ? 'Remove Seasonal' : 'Make Seasonal'}
                       </button>
                       <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100 hover:text-gray-950 transition-all">
                          <MoreVertical size={18} />
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
            className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm"
          >
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest px-4">Ingredient</th>
                  <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest px-4">Current Stock</th>
                  <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest px-4">Threshold</th>
                  <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest px-4">Status</th>
                  <th className="pb-6 text-[10px] font-black text-gray-300 uppercase tracking-widest px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ingredients.map(ing => (
                  <tr key={ing.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-6 px-4">
                      <p className="font-black text-gray-950 text-base">{ing.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {ing.id.toUpperCase()}</p>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black tabular-nums">{ing.currentStock}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase">{ing.unit}</span>
                      </div>
                    </td>
                    <td className="py-6 px-4 text-xs font-bold text-gray-400">{ing.threshold} {ing.unit}</td>
                    <td className="py-6 px-4">
                      {ing.currentStock <= ing.threshold ? (
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Low Stock</span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Healthy</span>
                      )}
                    </td>
                    <td className="py-6 px-4">
                       <button className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-gray-950 hover:shadow-md transition-all">
                          <Plus size={16} />
                       </button>
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
      {/* Header */}
      <header className="px-8 pt-12 pb-12 bg-white/50 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin')}
            className="p-4 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-all text-gray-400"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div className="w-16 h-16 bg-[#1C1412] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-black/20 group relative overflow-hidden">
             <ChefHat size={32} className="text-[#D4AF37] group-hover:scale-110 transition-transform" />
             <div className="absolute inset-0 bg-gradient-to-tr from-[#D4AF37]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-gray-950 tracking-tighter italic uppercase">Master Baker</h1>
               <div className="px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#D4AF37]/20">Pro Ops</div>
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live Pulse: {orders.length} Active Orders • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <nav className="flex gap-2">
          {[
            { id: 'floor', label: 'Prod. Floor', icon: ClipboardList },
            { id: 'dispatch', label: 'Dispatch', icon: Truck },
            { id: 'pantry', label: 'The Pantry', icon: Warehouse }
          ].map(module => (
            <button
              key={module.id}
              onClick={() => setActiveModule(module.id as any)}
              className={`flex items-center gap-3 px-8 py-5 rounded-[2.2rem] transition-all font-black uppercase tracking-widest text-[10px] ${activeModule === module.id ? 'bg-[#1C1412] text-white shadow-2xl shadow-black/20' : 'text-gray-400 hover:bg-black/5'}`}
            >
              <module.icon size={18} className={activeModule === module.id ? 'text-[#D4AF37]' : ''} />
              {module.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        <AnimatePresence mode="wait">
          {activeModule === 'floor' && (
            <motion.div key="floor" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ProductionFloor orders={orders} user={user} />
            </motion.div>
          )}
          {activeModule === 'dispatch' && (
            <motion.div key="dispatch" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <DispatchLogistics orders={orders} />
            </motion.div>
          )}
          {activeModule === 'pantry' && (
            <motion.div key="pantry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
