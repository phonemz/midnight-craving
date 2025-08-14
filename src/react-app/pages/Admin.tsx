import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { ArrowLeft, Search, Calendar, DollarSign, Package, CheckCircle, Users, UtensilsCrossed, LogOut, Settings, Trash2, Bell, X } from 'lucide-react';
import { OrderWithDetails } from '@/shared/types';
import MenuManagement from '@/react-app/components/MenuManagement';

export default function Admin() {
  const { user, isPending, redirectToLogin, logout } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyTotals, setDailyTotals] = useState<any>(null);
  const [menuAnalytics, setMenuAnalytics] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<'orders' | 'menu' | 'analytics'>('orders');
  
  const [notification, setNotification] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending && user) {
      fetchOrders();
      fetchDailyTotals();
      fetchMenuAnalytics();
    }
  }, [user, isPending]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchName) params.append('customer_name', searchName);
      if (selectedDate) params.append('date', selectedDate);

      const response = await fetch(`/api/admin/orders?${params}`);
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

  const fetchDailyTotals = async () => {
    try {
      const response = await fetch(`/api/admin/daily-totals?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setDailyTotals(data);
      }
    } catch (error) {
      console.error('Failed to fetch daily totals:', error);
    }
  };

  const fetchMenuAnalytics = async () => {
    try {
      const params = selectedDate ? `?date=${selectedDate}` : '';
      const response = await fetch(`/api/admin/menu-analytics${params}`);
      if (response.ok) {
        const data = await response.json();
        setMenuAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch menu analytics:', error);
    }
  };

  const handleMarkAllReady = async () => {
    try {
      const pendingCount = orders.filter(order => order.status === 'pending').length;
      if (pendingCount === 0) {
        setNotification('No pending orders to mark as ready.');
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      const response = await fetch('/api/admin/orders/mark-all-ready', {
        method: 'POST',
      });
      if (response.ok) {
        fetchOrders();
        setNotification(`${pendingCount} order${pendingCount !== 1 ? 's' : ''} marked as ready! Customers have been notified.`);
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Failed to mark orders ready:', error);
      setNotification('Failed to mark orders as ready. Please try again.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/complete`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchOrders();
        setNotification('Order completed successfully!');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Failed to complete order:', error);
      setNotification('Failed to complete order. Please try again.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteOrder = async (orderId: number, orderNumber: number) => {
    if (!confirm(`Are you sure you want to delete Order #${orderNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchOrders();
        fetchDailyTotals();
        setNotification(`Order #${orderNumber} deleted successfully.`);
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification('Failed to delete order. Please try again.');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      setNotification('Failed to delete order. Please try again.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // Fetch new data when date changes
    setTimeout(() => {
      fetchOrders();
      fetchDailyTotals();
      fetchMenuAnalytics();
    }, 100);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <UtensilsCrossed className="w-12 h-12 text-orange-500 mx-auto" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Admin Access</h2>
              <p className="text-gray-600">Please sign in with Google to access the admin panel</p>
            </div>
            
            <button
              onClick={redirectToLogin}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Sign in with Google
            </button>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-500 mr-2" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: 'Playfair Display, serif' }}>
                Admin Panel
              </h1>
            </div>
            <button
              onClick={logout}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome, {user.google_user_data.given_name || user.email}
          </h2>
          <p className="text-gray-600">Manage orders and view daily statistics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-1 border border-white/50">
          <button
            onClick={() => setCurrentView('orders')}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'orders'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Package className="w-5 h-5 mr-2" />
            Orders
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'analytics'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <DollarSign className="w-5 h-5 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setCurrentView('menu')}
            className={`flex-1 flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              currentView === 'menu'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Menu Management
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="mb-6 bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-slide-down">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-3" />
              <span className="font-medium">{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content based on current view */}
        {currentView === 'menu' ? (
          <MenuManagement onBack={() => setCurrentView('orders')} />
        ) : currentView === 'analytics' ? (
          <>
            {/* Menu Analytics */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Menu Item Analytics</h3>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedDate ? `Total quantities for ${new Date(selectedDate).toLocaleDateString()}` : 'Total quantities across all orders'}
                </p>
              </div>

              {menuAnalytics.length === 0 ? (
                <div className="p-12 text-center">
                  <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No order data found</p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuAnalytics.map((item: any) => {
                      const getItemTypeColor = (type: string) => {
                        switch (type) {
                          case 'fried_rice': return 'from-yellow-400 to-orange-500';
                          case 'curry': return 'from-red-400 to-pink-500';
                          case 'snack': return 'from-green-400 to-blue-500';
                          case 'tea': return 'from-purple-400 to-indigo-500';
                          default: return 'from-gray-400 to-gray-600';
                        }
                      };

                      const getItemTypeLabel = (type: string) => {
                        switch (type) {
                          case 'fried_rice': return 'Fried Rice';
                          case 'curry': return 'Curry';
                          case 'snack': return 'Snack';
                          case 'tea': return 'Tea';
                          default: return type;
                        }
                      };

                      return (
                        <div
                          key={item.id}
                          className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/30 overflow-hidden"
                        >
                          <div className={`bg-gradient-to-r ${getItemTypeColor(item.item_type)} p-4`}>
                            <h4 className="text-white font-semibold">{item.name}</h4>
                            <p className="text-white/80 text-sm">{getItemTypeLabel(item.item_type)}</p>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600 text-sm">Total Quantity:</span>
                              <span className="text-2xl font-bold text-gray-800">
                                {item.total_quantity || 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600 text-sm">Times Ordered:</span>
                              <span className="text-lg font-semibold text-orange-600">
                                {item.order_count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Back Button */}
            <div className="text-center">
              <button
                onClick={() => setCurrentView('orders')}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Orders
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Daily Totals */}
            {dailyTotals && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-800">{dailyTotals.total_orders || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center">
                    <UtensilsCrossed className="w-8 h-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Quantity</p>
                      <p className="text-2xl font-bold text-gray-800">{dailyTotals.total_quantity || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-orange-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-800">${(dailyTotals.total_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* Controls */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search by customer name"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Date Filter */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Mark All Ready */}
            <button
              onClick={handleMarkAllReady}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
            >
              <Bell className="w-4 h-4 mr-2" />
              Mark All Ready
            </button>
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">Orders</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin mb-4">
                <UtensilsCrossed className="w-8 h-8 text-orange-500 mx-auto" />
              </div>
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">
                        Order #{order.id}
                      </h4>
                      <p className="text-gray-600">
                        {order.customer.name} • {order.customer.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()} at{' '}
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-blue-600 font-medium mt-1">
                        Total Quantity: {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-800 mb-2">
                        ${order.total_amount.toFixed(2)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        {order.status !== 'completed' && (
                          <button
                            onClick={() => handleCompleteOrder(order.id)}
                            className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-green-600 transition-colors flex items-center"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-red-600 transition-colors flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-800 mb-2">Items:</h5>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.menu_item.name}
                          </span>
                          <span className="text-gray-800">
                            ${item.item_total.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
