import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { MenuItemWithOptions, CartItem } from '@/shared/types';

interface MenuCardProps {
  item: MenuItemWithOptions;
  onAddToCart: (cartItem: CartItem) => void;
}

export default function MenuCard({ item, onAddToCart }: MenuCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isAdded, setIsAdded] = useState(false);

  const isMultipleSelect = item.item_type === 'fried_rice';
  const isSingleSelect = item.item_type === 'curry' || item.item_type === 'tea';
  const hasOptions = item.options.length > 0;

  const calculatePrice = () => {
    let price = item.base_price;
    selectedOptions.forEach(optionId => {
      const option = item.options.find(opt => opt.id === optionId);
      if (option) {
        price += option.price_modifier;
      }
    });
    return price * quantity;
  };

  const handleOptionChange = (optionId: number) => {
    if (isMultipleSelect) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else if (isSingleSelect) {
      setSelectedOptions([optionId]);
    }
  };

  const handleAddToCart = () => {
    const cartItem: CartItem = {
      menu_item_id: item.id,
      name: item.name,
      quantity,
      selected_options: selectedOptions,
      item_total: calculatePrice(),
    };
    onAddToCart(cartItem);
    
    // Show success state
    setIsAdded(true);
    
    // Reset to original state after 1.5 seconds
    setTimeout(() => {
      setIsAdded(false);
      setQuantity(1);
      setSelectedOptions([]);
    }, 1500);
  };

  const getItemTypeColor = () => {
    switch (item.item_type) {
      case 'fried_rice':
        return 'from-yellow-400 to-orange-500';
      case 'curry':
        return 'from-red-400 to-pink-500';
      case 'snack':
        return 'from-green-400 to-blue-500';
      case 'tea':
        return 'from-purple-400 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getItemTypeLabel = () => {
    switch (item.item_type) {
      case 'fried_rice':
        return 'Fried Rice';
      case 'curry':
        return 'Curry';
      case 'snack':
        return 'Snack';
      case 'tea':
        return 'Tea';
      default:
        return 'Item';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getItemTypeColor()} p-4`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white font-semibold text-lg">{item.name}</h3>
            <p className="text-white/80 text-sm">{getItemTypeLabel()}</p>
          </div>
          <div className="text-white text-xl font-bold">
            ${item.base_price.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Options */}
        {hasOptions && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-800 mb-3">
              {isMultipleSelect ? 'Options (select multiple):' : 'Choose one option:'}
            </h4>
            <div className="space-y-2">
              {item.options.map(option => (
                <label
                  key={option.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type={isMultipleSelect ? 'checkbox' : 'radio'}
                      name={`option-${item.id}`}
                      value={option.id}
                      checked={selectedOptions.includes(option.id)}
                      onChange={() => handleOptionChange(option.id)}
                      className="mr-3 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-gray-700">{option.option_name}</span>
                  </div>
                  {option.price_modifier > 0 && (
                    <span className="text-sm text-orange-600 font-medium">
                      +${option.price_modifier.toFixed(2)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Quantity and Add to Cart */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-gray-700 font-medium">Quantity:</span>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`font-semibold px-6 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center min-w-[120px] ${
              isAdded 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white transform scale-105' 
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Added!
              </>
            ) : (
              `Add $${calculatePrice().toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
