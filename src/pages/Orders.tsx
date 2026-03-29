import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Package, Phone, MapPin, Calendar } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  product: string;
  totalPrice: number;
  date: string;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      setOrders(ordersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading orders...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white">All Orders</h3>
        <p className="text-gray-400 mt-1">
          Total Orders: <span className="text-white font-medium">{orders.length}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-white font-semibold text-lg">{order.customerName}</h4>
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(order.date)}
                </div>
              </div>
              <div className="bg-blue-600 text-white text-xl font-bold px-3 py-1 rounded-lg">
                ${order.totalPrice.toFixed(2)}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start">
                <Phone className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{order.phone}</span>
              </div>

              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{order.address}</span>
              </div>

              <div className="flex items-start">
                <Package className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{order.product}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <span className="text-xs text-gray-500">Order ID: {order.id}</span>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No orders yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Orders from WhatsApp or your store will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default Orders;
