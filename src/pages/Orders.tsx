import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Package, Phone, MapPin, Calendar, CreditCard, Tag, ChevronDown } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  customerEmail?: string;
  customerAddress: string;
  customerCity?: string;
  customerState?: string;
  customerPin?: string;
  customerLandmark?: string;
  customerInsta?: string;
  customerSize?: string;
  items: OrderItem[];
  total: number;
  subtotal?: number;
  codFee?: number;
  totalPrice?: number;
  paymentMethod: string;
  paymentId: string;
  advancePaid?: number;
  remainingOnDelivery?: number;
  status: string;
  createdAt: any;
}

// ============================================================
// ORDER STATUS CONFIG
// ============================================================
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  pending:    { label: 'Pending Approval', color: '#f59e0b', bg: '#1a1500', border: '#f59e0b', icon: '⏳' },
  cod:        { label: 'COD',              color: '#8b5cf6', bg: '#120a1f', border: '#8b5cf6', icon: '💵' },
  online:     { label: 'Online Payment',   color: '#3b82f6', bg: '#0a0f1f', border: '#3b82f6', icon: '💳' },
  shipped:    { label: 'Shipped',          color: '#06b6d4', bg: '#001a1f', border: '#06b6d4', icon: '🚚' },
  cancelled:  { label: 'Cancelled',        color: '#ef4444', bg: '#1f0a0a', border: '#ef4444', icon: '❌' },
  done:       { label: 'Order Done',       color: '#22c55e', bg: '#001f0a', border: '#22c55e', icon: '✅' },
  all:        { label: 'All Orders',       color: '#9ca3af', bg: '#111',    border: '#374151', icon: '📦' },
};

const ORDER_STATUSES = ['pending', 'cod', 'online', 'shipped', 'cancelled', 'done'];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const snap = await getDocs(collection(db, 'orders'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
      data.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bT = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return bT - aT;
      });
      setOrders(data);
    } catch (e) {
      console.error('Error fetching orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Failed to update. Try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getTotal = (order: Order) => Number(order.total ?? order.totalPrice ?? 0);

  const formatDate = (ts: any) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return 'Unknown'; }
  };

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => (o.status || 'pending') === activeTab);

  const countFor = (status: string) => status === 'all'
    ? orders.length
    : orders.filter(o => (o.status || 'pending') === status).length;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-white text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-400">Loading orders...</p>
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-white">Orders</h3>
          <p className="text-gray-400 text-sm mt-1">Total: <span className="text-white font-medium">{orders.length}</span></p>
        </div>
        <button onClick={fetchOrders} className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-lg transition-colors">
          🔄 Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{scrollbarWidth:'none'}}>
        {['all', ...ORDER_STATUSES].map(status => {
          const cfg = STATUS_CONFIG[status];
          const count = countFor(status);
          const isActive = activeTab === status;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: '20px',
                border: `1px solid ${isActive ? cfg.color : '#374151'}`,
                background: isActive ? cfg.bg : 'transparent',
                color: isActive ? cfg.color : '#9ca3af',
                fontSize: '0.82rem',
                fontWeight: isActive ? '700' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {cfg.icon} {cfg.label}
              {count > 0 && (
                <span style={{
                  marginLeft: '6px',
                  background: isActive ? cfg.color : '#374151',
                  color: isActive ? '#000' : '#fff',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">{STATUS_CONFIG[activeTab]?.icon || '📦'}</div>
          <p className="text-gray-400 text-lg">No orders in this section</p>
          <p className="text-gray-500 text-sm mt-2">Orders will appear here when assigned</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const statusCfg = STATUS_CONFIG[order.status || 'pending'];
            const isExpanded = expandedId === order.id;
            const isCodOrder = order.paymentMethod === 'cod';

            return (
              <div
                key={order.id}
                style={{
                  background: '#111',
                  border: `1px solid ${statusCfg?.border || '#374151'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                {/* Order Header — always visible */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-white font-bold text-base truncate">{order.customerName}</h4>
                        {/* Status Badge */}
                        <span style={{
                          background: statusCfg?.bg,
                          color: statusCfg?.color,
                          border: `1px solid ${statusCfg?.border}`,
                          borderRadius: '12px',
                          padding: '2px 10px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}>
                          {statusCfg?.icon} {statusCfg?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(order.createdAt)}
                        </span>
                        <span className="text-gray-400 text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {order.customerPhone}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div style={{ color: statusCfg?.color, fontWeight: '800', fontSize: '1.1rem' }}>
                        ₹{getTotal(order).toLocaleString()}
                      </div>
                      {isCodOrder && order.advancePaid && (
                        <div className="text-xs text-green-400 mt-1">Advance: ₹{order.advancePaid}</div>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-500 mt-1 ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #222', padding: '16px' }}>

                    {/* Customer Details */}
                    <div className="space-y-2 mb-4">
                      {order.customerEmail && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-400 text-sm">📧</span>
                          <span className="text-gray-300 text-sm">{order.customerEmail}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">
                          {order.customerAddress}
                          {order.customerCity && `, ${order.customerCity}`}
                          {order.customerState && `, ${order.customerState}`}
                          {order.customerPin && ` - ${order.customerPin}`}
                          {order.customerLandmark && ` (Near ${order.customerLandmark})`}
                        </span>
                      </div>
                      {order.customerAltPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">Alt: {order.customerAltPhone}</span>
                        </div>
                      )}
                      {order.customerSize && order.customerSize !== 'N/A' && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-300 text-sm">Size: {order.customerSize}</span>
                        </div>
                      )}
                      {order.customerInsta && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">📸</span>
                          <span className="text-blue-400 text-sm">{order.customerInsta}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment Info */}
                    <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300 text-sm font-semibold">Payment Details</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Method</span>
                          <span className="text-white font-medium">
                            {isCodOrder ? '💵 Cash on Delivery' : '💳 Online Payment'}
                          </span>
                        </div>
                        {order.subtotal && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="text-white">₹{Number(order.subtotal).toLocaleString()}</span>
                          </div>
                        )}
                        {isCodOrder && order.advancePaid && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Advance Paid</span>
                              <span className="text-green-400 font-medium">₹{order.advancePaid} ✅</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Remaining on Delivery</span>
                              <span className="text-yellow-400 font-medium">₹{order.remainingOnDelivery}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                          <span className="text-gray-400 font-semibold">Total</span>
                          <span className="text-white font-bold">₹{getTotal(order).toLocaleString()}</span>
                        </div>
                        {order.paymentId && order.paymentId !== 'COD' && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Payment ID</span>
                            <span className="text-gray-300 text-xs font-mono truncate max-w-40">{order.paymentId}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ background: '#1a1a1a', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                        <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Items Ordered</p>
                        <div className="space-y-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Package className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{item.name}</span>
                                <span className="text-gray-500 text-xs">x{item.quantity}</span>
                              </div>
                              <span className="text-white text-sm font-medium">₹{Number(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ORDER ID */}
                    <p className="text-gray-600 text-xs mb-4">Order ID: {order.id}</p>

                    {/* STATUS CHANGE BUTTONS */}
                    <div>
                      <p className="text-gray-400 text-xs font-semibold uppercase mb-3">Move Order To:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {ORDER_STATUSES.filter(s => s !== (order.status || 'pending')).map(status => {
                          const cfg = STATUS_CONFIG[status];
                          return (
                            <button
                              key={status}
                              onClick={() => updateStatus(order.id, status)}
                              disabled={updatingId === order.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${cfg.border}`,
                                background: cfg.bg,
                                color: cfg.color,
                                fontSize: '0.82rem',
                                fontWeight: '600',
                                cursor: updatingId === order.id ? 'not-allowed' : 'pointer',
                                opacity: updatingId === order.id ? 0.5 : 1,
                                transition: 'all 0.2s',
                                textAlign: 'left',
                              }}
                            >
                              {cfg.icon} {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                      {updatingId === order.id && (
                        <p className="text-gray-400 text-xs text-center mt-2">Updating...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
