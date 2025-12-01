import React from 'react';
import { Package, Tent, Bed, Waves, Flame } from 'lucide-react';

const EquipmentPage: React.FC = () => {
  // Mock data from backend seed
  const equipment = [
    {
      name: 'Tent (4-person)',
      description: 'Spacious 4-person camping tent',
      category: 'CAMPING_GEAR',
      quantity: 10,
      available: 10,
      dailyRate: 15.00,
      weeklyRate: 75.00,
      deposit: 50.00,
      icon: Tent,
      color: 'bg-green-500',
    },
    {
      name: 'Sleeping Bag',
      description: 'Warm sleeping bag for all seasons',
      category: 'CAMPING_GEAR',
      quantity: 20,
      available: 20,
      dailyRate: 5.00,
      weeklyRate: 25.00,
      deposit: 20.00,
      icon: Bed,
      color: 'bg-blue-500',
    },
    {
      name: 'Kayak',
      description: 'Single-person kayak with paddle',
      category: 'RECREATIONAL',
      quantity: 5,
      available: 5,
      dailyRate: 25.00,
      weeklyRate: 125.00,
      deposit: 100.00,
      icon: Waves,
      color: 'bg-cyan-500',
    },
    {
      name: 'Camping Stove',
      description: 'Portable propane camping stove',
      category: 'KITCHEN',
      quantity: 8,
      available: 8,
      dailyRate: 10.00,
      weeklyRate: 50.00,
      deposit: 30.00,
      icon: Flame,
      color: 'bg-orange-500',
    },
  ];

  const totalItems = equipment.reduce((sum, e) => sum + e.quantity, 0);
  const totalAvailable = equipment.reduce((sum, e) => sum + e.available, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Equipment Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage rental equipment inventory and availability
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalAvailable}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 font-bold">#</span>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {equipment.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{item.description}</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Quantity:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Available:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{item.available}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Daily Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${item.dailyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Weekly Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${item.weeklyRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Deposit:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">${item.deposit.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${(item.available / item.quantity) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  {item.available} of {item.quantity} available
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Note:</strong> This data is from the backend seed file. Connect to the API to manage equipment in real-time.
        </p>
      </div>
    </div>
  );
};

export default EquipmentPage;
