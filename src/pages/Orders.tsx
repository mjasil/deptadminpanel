import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Package, Phone, MapPin, Calendar, CreditCard, Tag } from 'lucide-react';

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
  customerAddress: string;
  customerCity?: string;
  customerState?: string;
  customerPin?: string;
  customerLandmark?: string;
  customerInsta?: string;
  customerSize?: string;
  items: OrderItem[];
  total: number;
  totalPrice?: number;
  paymentMethod: string;
  paymentId: string;
  status: string;
  createdAt: any;
}

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-600',
  confirmed: 'bg-blue-600',
  shipped:   'bg-purple-600',
  delivered: 'bg-green-600',
  cancelled: 'bg-red-600',
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[];

      ordersData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
        const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
        return bTime - aTime;
      });

      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Safely get total — handles both 'total' and 'totalPrice' field names
  const getTotal = (order: Order): number => {
    return Number(order.total ?? order.totalPrice ?? 0);
  };

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-gray-400">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white">All Orders</h3>
        <p className="text-gray-400 mt-1">
          Total Orders: <span className="text-white font-medium">{orders.length}</span>
        </p>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            {/* Order Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-semibold text-lg">{order.customerName}</h4>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="bg-blue-600 text-white text-lg font-bold px-3 py-1 rounded-lg">
                ₹{getTotal(order).toLocaleString()}
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="mb-4 flex items-center gap-2">
              <select
                value={order.status || 'pending'}
                onChange={(e) => updateStatus(order.id, e.target.value)}
                disabled={updatingId === order.id}
                className={`text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer text-white ${statusColors[order.status] || 'bg-yellow-600'}`}
              >
                <option value="pending">🕐 Pending</option>
                <option value="confirmed">✅ Confirmed</option>
                <option value="shipped">🚚 Shipped</option>
                <option value="delivered">📦 Delivered</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
              {updatingId === order.id && (
                <span className="text-gray-400 text-xs">Updating...</span>
              )}
            </div>

            {/* Customer Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-start">
                <Phone className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {order.customerPhone}
                  {order.customerAltPhone && ` / ${order.customerAltPhone}`}
                </span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {order.customerAddress}
                  {order.customerCity && `, ${order.customerCity}`}
                  {order.customerState && `, ${order.customerState}`}
                  {order.customerPin && ` - ${order.customerPin}`}
                  {order.customerLandmark && ` (Near ${order.customerLandmark})`}
                </span>
              </div>
              {order.customerSize && order.customerSize !== 'N/A' && (
                <div className="flex items-start">
                  <Tag className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Size: {order.customerSize}</span>
                </div>
              )}
              <div className="flex items-start">
                <CreditCard className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}
                  {order.paymentId && order.paymentId !== 'COD' && order.paymentId !== 'PENDING' && (
                    <span className="text-gray-500 ml-1 text-xs">({order.paymentId})</span>
                  )}
                </span>
              </div>
              {order.customerInsta && (
                <div className="flex items-start">
                  <span className="text-gray-400 text-xs mr-2 mt-0.5">📸</span>
                  <span className="text-blue-400 text-sm">{order.customerInsta}</span>
                </div>
              )}
            </div>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs font-semibold uppercase mb-2">Items Ordered</p>
                <div className="space-y-1 bg-gray-900 rounded-lg p-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Package className="w-3 h-3 text-gray-500 mr-1 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{item.name}</span>
                        <span className="text-gray-500 text-xs ml-1">x{item.quantity}</span>
                      </div>
                      <span className="text-white text-sm font-medium">
                        ₹{Number(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order ID */}
            <div className="pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-500">Order ID: {order.id}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No orders yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Orders from your store will appear here automatically
          </p>
        </div>
      )}
    </div>
  );
};

export default Orders;
