import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, UtensilsCrossed } from 'lucide-react';
import { MenuItemWithOptions, MenuItemOption } from '@/shared/types';

interface MenuManagementProps {
  onBack: () => void;
}

export default function MenuManagement({ onBack }: MenuManagementProps) {
  const [menuItems, setMenuItems] = useState<MenuItemWithOptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ name: '', base_price: 0, item_type: 'snack' as 'fried_rice' | 'curry' | 'snack' | 'tea' });
  const [showNewItem, setShowNewItem] = useState(false);
  const [newOption, setNewOption] = useState<{ [key: number]: { option_name: string; price_modifier: number } }>({});

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
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

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        setNewItem({ name: '', base_price: 0, item_type: 'snack' });
        setShowNewItem(false);
        fetchMenu();
      } else {
        alert('Failed to create menu item');
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
      alert('Error creating menu item');
    }
  };

  const handleUpdateItem = async (id: number, data: any) => {
    try {
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEditingItem(null);
        fetchMenu();
      } else {
        alert('Failed to update menu item');
      }
    } catch (error) {
      console.error('Error updating menu item:', error);
      alert('Error updating menu item');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item? This will also delete all its options.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/menu/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMenu();
      } else {
        alert('Failed to delete menu item');
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
      alert('Error deleting menu item');
    }
  };

  const handleCreateOption = async (menuItemId: number) => {
    const optionData = newOption[menuItemId];
    if (!optionData?.option_name) return;

    try {
      const response = await fetch(`/api/admin/menu/${menuItemId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(optionData),
      });

      if (response.ok) {
        setNewOption(prev => ({ ...prev, [menuItemId]: { option_name: '', price_modifier: 0 } }));
        fetchMenu();
      } else {
        alert('Failed to create option');
      }
    } catch (error) {
      console.error('Error creating option:', error);
      alert('Error creating option');
    }
  };

  const handleUpdateOption = async (id: number, data: any) => {
    try {
      const response = await fetch(`/api/admin/menu/options/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setEditingOption(null);
        fetchMenu();
      } else {
        alert('Failed to update option');
      }
    } catch (error) {
      console.error('Error updating option:', error);
      alert('Error updating option');
    }
  };

  const handleDeleteOption = async (id: number) => {
    if (!confirm('Are you sure you want to delete this option?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/menu/options/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMenu();
      } else {
        alert('Failed to delete option');
      }
    } catch (error) {
      console.error('Error deleting option:', error);
      alert('Error deleting option');
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin mb-4">
          <UtensilsCrossed className="w-8 h-8 text-orange-500 mx-auto" />
        </div>
        <p className="text-gray-600 ml-3">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewItem(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Orders
          </button>
        </div>
      </div>

      {/* New Item Form */}
      {showNewItem && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Menu Item</h3>
          <form onSubmit={handleCreateItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Item name"
              value={newItem.name}
              onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
            <input
              type="number"
              step="0.01"
              placeholder="Base price"
              value={newItem.base_price || ''}
              onChange={(e) => setNewItem(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              required
            />
            <select
              value={newItem.item_type}
              onChange={(e) => setNewItem(prev => ({ ...prev, item_type: e.target.value as 'fried_rice' | 'curry' | 'snack' | 'tea' }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="snack">Snack</option>
              <option value="fried_rice">Fried Rice</option>
              <option value="curry">Curry</option>
              <option value="tea">Tea</option>
            </select>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowNewItem(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Menu Items */}
      <div className="space-y-4">
        {menuItems.map((item) => (
          <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            {/* Item Header */}
            <div className={`bg-gradient-to-r ${getItemTypeColor(item.item_type)} p-4`}>
              <div className="flex justify-between items-center">
                {editingItem === item.id ? (
                  <EditItemForm
                    item={item}
                    onSave={(data) => handleUpdateItem(item.id, data)}
                    onCancel={() => setEditingItem(null)}
                  />
                ) : (
                  <>
                    <div>
                      <h3 className="text-white font-semibold text-lg">{item.name}</h3>
                      <p className="text-white/80 text-sm">{getItemTypeLabel(item.item_type)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-white text-xl font-bold">
                        ${item.base_price.toFixed(2)}
                      </div>
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="text-white/80 hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-white/80 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-800">Options</h4>
                <button
                  onClick={() => setNewOption(prev => ({ ...prev, [item.id]: { option_name: '', price_modifier: 0 } }))}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Option
                </button>
              </div>

              {/* New Option Form */}
              {newOption[item.id] && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Option name"
                      value={newOption[item.id]?.option_name || ''}
                      onChange={(e) => setNewOption(prev => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], option_name: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price modifier"
                      value={newOption[item.id]?.price_modifier || ''}
                      onChange={(e) => setNewOption(prev => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], price_modifier: parseFloat(e.target.value) || 0 }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCreateOption(item.id)}
                        className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600 transition-colors flex items-center"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </button>
                      <button
                        onClick={() => setNewOption(prev => {
                          const newState = { ...prev };
                          delete newState[item.id];
                          return newState;
                        })}
                        className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="space-y-2">
                {item.options.map((option) => (
                  <div key={option.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                    {editingOption === option.id ? (
                      <EditOptionForm
                        option={option}
                        onSave={(data) => handleUpdateOption(option.id, data)}
                        onCancel={() => setEditingOption(null)}
                      />
                    ) : (
                      <>
                        <div>
                          <span className="text-gray-700">{option.option_name}</span>
                          {option.price_modifier > 0 && (
                            <span className="ml-2 text-sm text-orange-600 font-medium">
                              +${option.price_modifier.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingOption(option.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteOption(option.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {item.options.length === 0 && (
                  <p className="text-gray-500 text-sm italic">No options available</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditItemForm({ item, onSave, onCancel }: {
  item: MenuItemWithOptions;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item.name,
    base_price: item.base_price,
    item_type: item.item_type,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3 w-full">
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        className="flex-1 px-3 py-1 border border-white/30 rounded bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
        required
      />
      <input
        type="number"
        step="0.01"
        value={formData.base_price}
        onChange={(e) => setFormData(prev => ({ ...prev, base_price: parseFloat(e.target.value) || 0 }))}
        className="w-24 px-3 py-1 border border-white/30 rounded bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
        required
      />
      <select
        value={formData.item_type}
        onChange={(e) => setFormData(prev => ({ ...prev, item_type: e.target.value as 'fried_rice' | 'curry' | 'snack' | 'tea' }))}
        className="px-3 py-1 border border-white/30 rounded bg-white/20 text-white focus:ring-2 focus:ring-white/50"
      >
        <option value="snack">Snack</option>
        <option value="fried_rice">Fried Rice</option>
        <option value="curry">Curry</option>
        <option value="tea">Tea</option>
      </select>
      <button type="submit" className="text-white hover:text-white/80">
        <Save className="w-4 h-4" />
      </button>
      <button type="button" onClick={onCancel} className="text-white hover:text-white/80">
        <X className="w-4 h-4" />
      </button>
    </form>
  );
}

function EditOptionForm({ option, onSave, onCancel }: {
  option: MenuItemOption;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    option_name: option.option_name,
    price_modifier: option.price_modifier,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3 w-full">
      <input
        type="text"
        value={formData.option_name}
        onChange={(e) => setFormData(prev => ({ ...prev, option_name: e.target.value }))}
        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        required
      />
      <input
        type="number"
        step="0.01"
        value={formData.price_modifier}
        onChange={(e) => setFormData(prev => ({ ...prev, price_modifier: parseFloat(e.target.value) || 0 }))}
        className="w-24 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
      <button type="submit" className="text-green-600 hover:text-green-700">
        <Save className="w-3 h-3" />
      </button>
      <button type="button" onClick={onCancel} className="text-gray-600 hover:text-gray-700">
        <X className="w-3 h-3" />
      </button>
    </form>
  );
}
