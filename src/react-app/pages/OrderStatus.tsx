import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, CheckCircle, UtensilsCrossed, Search, Phone } from 'lucide-react';
import { Order } from '@/shared/types';

export default function OrderStatus() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCustomerId = localStorage.getItem('customerId');
    if (storedCustomerId) {
      const id = parseInt(storedCustomerId);
      setCustomerId(id);
      fetchOrders(id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (customerIdToSearch: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/customer/${customerIdToSearch}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    try {
      setLoading(true);
      // First, we need to find the customer by phone
      // Since we don't have a direct API for this, we'll need to handle this differently
      // For now, let's assume the customer enters their customer ID or we implement phone search
      alert('Phone search feature coming soon. Please use the direct link from your order confirmation.');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'ready':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'ready':
        return <UtensilsCrossed className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Preparing';
      case 'ready':
        return 'Ready for Pickup';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center">
              <UtensilsCrossed className="w-8 h-8 text-orange-500 mr-2" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: 'Playfair Display, serif' }}>
                Order Status
              </h1>
            </div>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {!customerId && (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Check Your Order Status
            </h2>
            
            <form onSubmit={handlePhoneSearch} className="space-y-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your phone number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    id="phone"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    placeholder="Enter the phone number used for ordering"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !searchPhone.trim()}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {loading ? (
                  'Searching...'
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Find My Orders
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Want to place a new order?{' '}
                <button
                  onClick={() => navigate('/')}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Start Ordering
                </button>
              </p>
            </div>
          </div>
        )}

        {customerId && (
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Your Orders</h2>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin mb-4">
                  <UtensilsCrossed className="w-12 h-12 text-orange-500 mx-auto" />
                </div>
                <p className="text-gray-600">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-12 text-center">
                <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
                <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                <button
                  onClick={() => navigate('/order')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Place Your First Order
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            Order #{order.id}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Placed on {new Date(order.created_at).toLocaleDateString()} at{' '}
                            {new Date(order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-800">
                            ${order.total_amount.toFixed(2)}
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusText(order.status)}</span>
                          </div>
                        </div>
                      </div>

                      {order.status === 'ready' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center">
                            <UtensilsCrossed className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-blue-800 font-medium">
                              Your order is ready for pickup!
                            </span>
                          </div>
                        </div>
                      )}

                      {order.status === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <span className="text-green-800 font-medium">
                              Order completed. Thank you!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/order')}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Place Another Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
