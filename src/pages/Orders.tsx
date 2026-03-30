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
  paymentMethod: string;
  paymentId: string;
  status: string;
  createdAt: any; // Firebase Timestamp or Date
}

const statusColors: Record<string, string> = {
  pending:   'bg-yellow-600 text-white',
  confirmed: 'bg-blue-600 text-white',
  shipped:   'bg-purple-600 text-white',
  delivered: 'bg-green-600 text-white',
  cancelled: 'bg-red-600 text-white',
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

      // Sort by createdAt descending (newest first)
      ordersData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt) || 0;
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt) || 0;
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
      alert('Failed to update status. Try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      // Handle Firebase Timestamp
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
          <p>Loading orders...</p>
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
              <div className="text-right">
                <div className="bg-blue-600 text-white text-lg font-bold px-3 py-1 rounded-lg">
                  ₹{Number(order.total).toLocaleString()}
                </div>
              </div>
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
                  {order.customerLandmark && ` (${order.customerLandmark})`}
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
                <span className="text-gray-300 text-sm capitalize">
                  {order.paymentMethod ===
