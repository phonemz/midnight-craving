import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import MenuCard from '@/react-app/components/MenuCard';
import Cart from '@/react-app/components/Cart';
import { MenuItemWithOptions, CartItem } from '@/shared/types';

export default function Order() {
  const [menuItems, setMenuItems] = useState<MenuItemWithOptions[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [showOrderedItems, setShowOrderedItems] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedCustomerId = localStorage.getItem('customerId');
    if (!storedCustomerId) {
      navigate('/');
      return;
    }
    const parsedCustomerId = parseInt(storedCustomerId);
    if (isNaN(parsedCustomerId)) {
      navigate('/');
      return;
    }
    setCustomerId(parsedCustomerId);
    
    // Load cart items from localStorage
    const storedCartItems = localStorage.getItem('cartItems');
    if (storedCartItems) {
      try {
        const cartItems = JSON.parse(storedCartItems);
        setCartItems(cartItems);
      } catch (error) {
        console.error('Failed to parse stored cart items:', error);
      }
    }

    // Load order submission state from localStorage
    const storedOrderSubmitted = localStorage.getItem('orderSubmitted');
    const storedLastOrderId = localStorage.getItem('lastOrderId');
    if (storedOrderSubmitted === 'true' && storedLastOrderId) {
      setOrderSubmitted(true);
      setLastOrderId(parseInt(storedLastOrderId));
    }
    
    fetchMenu();
  }, [navigate]);

  // Save cart items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save order submission state to localStorage
  useEffect(() => {
    localStorage.setItem('orderSubmitted', orderSubmitted.toString());
  }, [orderSubmitted]);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => [...prev, item]);
  };

  const handleUpdateCartItem = (index: number, updatedItem: CartItem) => {
    setCartItems(prev => prev.map((item, i) => i === index ? updatedItem : item));
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!customerId) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
          items: cartItems.map(item => ({
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            selected_options: item.selected_options,
          })),
        }),
      });

      if (response.ok) {
        const order = await response.json();
        localStorage.setItem('lastOrderId', order.id.toString());
        setLastOrderId(order.id);
        setOrderSubmitted(true);
        setShowOrderedItems(false); // Hide cart initially after submission
      } else {
        alert('Failed to submit order. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    if (!acc[item.item_type]) {
      acc[item.item_type] = [];
    }
    acc[item.item_type].push(item);
    return acc;
  }, {} as Record<string, MenuItemWithOptions[]>);

  const getCategoryTitle = (type: string) => {
    switch (type) {
      case 'fried_rice': return 'Fried Rice';
      case 'curry': return 'Curry Dishes';
      case 'snack': return 'Snacks';
      case 'tea': return 'Tea & Beverages';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <UtensilsCrossed className="w-12 h-12 text-orange-500 mx-auto" />
          </div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/50 sticky top-0 z-10">
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
              <UtensilsCrossed className="w-8 h-8 text-orange-500 mr-2" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent" style={{ fontFamily: 'Playfair Display, serif' }}>
                Feast Flow
              </h1>
            </div>
            <div className="w-16"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Our Menu</h2>
            
            {Object.entries(groupedMenuItems).map(([type, items]) => (
              <div key={type} className="mb-12">
                <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                  {getCategoryTitle(type)}
                  <div className="ml-4 h-px bg-gradient-to-r from-orange-300 to-transparent flex-1"></div>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {items.map(item => (
                    <MenuCard
                      key={item.id}
                      item={item}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              {orderSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UtensilsCrossed className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-800 mb-2">
                      Order Submitted Successfully!
                    </h3>
                    <p className="text-green-700 mb-4">
                      Order #{lastOrderId} has been received and is being prepared.
                    </p>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowOrderedItems(!showOrderedItems)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mr-3"
                      >
                        {showOrderedItems ? 'Hide' : 'Show'} Ordered Items
                      </button>
                      <button
                        onClick={() => {
                          setOrderSubmitted(false);
                          setCartItems([]);
                          setLastOrderId(null);
                          setShowOrderedItems(false);
                          // Clear localStorage
                          localStorage.removeItem('cartItems');
                          localStorage.removeItem('orderSubmitted');
                          localStorage.removeItem('lastOrderId');
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Start New Order
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
              
              {/* Show cart if order not submitted or if showing ordered items */}
              {(!orderSubmitted || showOrderedItems) && (
                <Cart
                  items={cartItems}
                  onUpdateItem={handleUpdateCartItem}
                  onRemoveItem={handleRemoveCartItem}
                  onSubmitOrder={handleSubmitOrder}
                  isSubmitting={submitting}
                  readOnly={orderSubmitted && showOrderedItems}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
