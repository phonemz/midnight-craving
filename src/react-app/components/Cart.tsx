import { useState } from 'react';
import { Trash2, Edit3, ShoppingCart, Check } from 'lucide-react';
import { CartItem } from '@/shared/types';

interface CartProps {
  items: CartItem[];
  onUpdateItem: (index: number, item: CartItem) => void;
  onRemoveItem: (index: number) => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
  readOnly?: boolean;
}

export default function Cart({ items, onUpdateItem, onRemoveItem, onSubmitOrder, isSubmitting, readOnly = false }: CartProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);

  const total = items.reduce((sum, item) => sum + item.item_total, 0);
  const isEmpty = items.length === 0;

  const handleSubmit = () => {
    if (!isEmpty) {
      onSubmitOrder();
    }
  };

  const startEditing = (index: number, currentQuantity: number) => {
    setEditingIndex(index);
    setEditQuantity(currentQuantity);
  };

  const saveEdit = (index: number) => {
    const item = items[index];
    const unitPrice = item.item_total / item.quantity;
    const updatedItem: CartItem = {
      ...item,
      quantity: editQuantity,
      item_total: unitPrice * editQuantity,
    };
    onUpdateItem(index, updatedItem);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  if (isEmpty) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <ShoppingCart className="w-6 h-6 text-orange-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-800">Your Cart</h2>
        </div>
        <div className="text-center py-8">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Your cart is empty</p>
          <p className="text-sm text-gray-400 mt-1">Add some delicious items from the menu!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
        <div className="flex items-center text-white">
          <ShoppingCart className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-semibold">{readOnly ? 'Order Details' : 'Your Cart'}</h2>
          <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-sm">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="p-6">
        <div className="space-y-4 mb-6">
          {items.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.name}</h4>
                  <div className="flex items-center mt-2 space-x-4">
                    {!readOnly && editingIndex === index ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <button
                          onClick={() => saveEdit(index)}
                          className="text-green-600 hover:text-green-700 p-1"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                        {!readOnly && (
                          <button
                            onClick={() => startEditing(index, item.quantity)}
                            className="text-orange-600 hover:text-orange-700 text-sm flex items-center"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-800">
                    ${item.item_total.toFixed(2)}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={() => onRemoveItem(index)}
                      className="text-red-500 hover:text-red-700 mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between items-center text-xl font-semibold">
            <span>Total:</span>
            <span className="text-orange-600">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button - only show if not read-only */}
        {!readOnly && (
          <button
            onClick={handleSubmit}
            disabled={isEmpty || isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {isSubmitting ? 'Submitting Order...' : 'Submit Order'}
          </button>
        )}
      </div>
    </div>
  );
}
