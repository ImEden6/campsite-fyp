/**
 * Module Library
 * Sidebar for dragging modules onto the map
 */

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Home, Building, Package, Car, Droplets, Zap, TreePine, Trash2, Search, MapPin } from 'lucide-react';
import type { ModuleTemplate, ModuleType } from '@/types';

// Mock templates - in real app, these would come from a service
const mockTemplates: ModuleTemplate[] = [
  {
    id: '1',
    name: 'Standard Campsite',
    description: 'Basic camping spot with fire pit',
    type: 'campsite',
    defaultSize: { width: 100, height: 100 },
    defaultMetadata: {
      name: 'Campsite',
      capacity: 4,
      amenities: ['fire_pit', 'picnic_table'],
      pricing: { basePrice: 25, seasonalMultiplier: 1.0 },
      accessibility: false,
      electricHookup: false,
      waterHookup: false,
      sewerHookup: false,
    },
    icon: 'home',
    color: '#3B82F6',
    category: 'accommodation',
    customizable: true,
    tags: ['basic', 'popular', 'affordable'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'RV Site with Hookups',
    description: 'Full hookup RV site',
    type: 'campsite',
    defaultSize: { width: 120, height: 150 },
    defaultMetadata: {
      name: 'RV Site',
      capacity: 6,
      amenities: ['picnic_table', 'fire_pit', 'hookups'],
      pricing: { basePrice: 45, seasonalMultiplier: 1.2 },
      accessibility: true,
      electricHookup: true,
      waterHookup: true,
      sewerHookup: true,
    },
    icon: 'car',
    color: '#3B82F6',
    category: 'accommodation',
    customizable: true,
    tags: ['rv', 'hookups', 'premium'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'Restroom Building',
    description: 'Public restroom facility',
    type: 'toilet',
    defaultSize: { width: 80, height: 120 },
    defaultMetadata: {
      name: 'Restroom',
      capacity: 20,
      facilities: ['male', 'female', 'accessible'],
      maintenanceSchedule: 'Daily',
      accessible: true,
    },
    icon: 'building',
    color: '#8B5CF6',
    category: 'facilities',
    customizable: true,
    tags: ['essential', 'public', 'accessible'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    name: 'Storage Shed',
    description: 'Equipment storage building',
    type: 'storage',
    defaultSize: { width: 60, height: 60 },
    defaultMetadata: {
      name: 'Storage',
      storageType: 'equipment',
      capacity: 100,
      contents: [],
      accessLevel: 'staff',
    },
    icon: 'package',
    color: '#8B5CF6',
    category: 'facilities',
    customizable: true,
    tags: ['storage', 'maintenance', 'staff'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    name: 'Water Tap',
    description: 'Fresh water source',
    type: 'water_source',
    defaultSize: { width: 30, height: 30 },
    defaultMetadata: {
      name: 'Water Tap',
      sourceType: 'tap',
      potable: true,
      pressure: 40,
      capacity: 1000,
    },
    icon: 'droplets',
    color: '#F59E0B',
    category: 'utilities',
    customizable: true,
    tags: ['water', 'essential', 'public'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '6',
    name: 'Electrical Box',
    description: '30amp electrical hookup',
    type: 'electricity',
    defaultSize: { width: 25, height: 25 },
    defaultMetadata: {
      name: 'Electrical Box',
      voltage: 120,
      amperage: 30,
      outlets: 2,
      circuitType: '30amp',
      weatherproof: true,
    },
    icon: 'zap',
    color: '#F59E0B',
    category: 'utilities',
    customizable: true,
    tags: ['electrical', 'hookup', 'rv'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '7',
    name: 'Playground',
    description: 'Children\'s play area',
    type: 'recreation',
    defaultSize: { width: 150, height: 150 },
    defaultMetadata: {
      name: 'Playground',
      activityType: 'playground',
      capacity: 20,
      equipment: ['swings', 'slide', 'sandbox'],
      ageRestrictions: '2-12 years',
      safetyRequirements: ['adult_supervision'],
    },
    icon: 'tree-pine',
    color: '#10B981',
    category: 'recreation',
    customizable: true,
    tags: ['kids', 'family', 'safety'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '8',
    name: 'Parking Area',
    description: 'Vehicle parking space',
    type: 'parking',
    defaultSize: { width: 200, height: 100 },
    defaultMetadata: {
      name: 'Parking',
      capacity: 10,
      vehicleTypes: ['car', 'rv'],
      accessible: true,
    },
    icon: 'car',
    color: '#6B7280',
    category: 'infrastructure',
    customizable: true,
    tags: ['parking', 'vehicle', 'accessible'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface DraggableModuleProps {
  template: ModuleTemplate;
}

const DraggableModule: React.FC<DraggableModuleProps> = ({ template }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `module-${template.id}`,
    data: { template },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const getIcon = (type: ModuleType) => {
    const iconMap: Record<ModuleType, React.ComponentType<{ className?: string }>> = {
      campsite: Home,
      toilet: Building,
      storage: Package,
      building: Building,
      parking: Car,
      road: MapPin,
      water_source: Droplets,
      electricity: Zap,
      waste_disposal: Trash2,
      recreation: TreePine,
      custom: Building,
    };
    return iconMap[type] || Building;
  };

  const Icon = getIcon(template.type);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={style}
    >
      <div className="flex items-center space-x-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: template.color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {template.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {template.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export const ModuleLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Note: Drop handling is done in MapCanvas component via useDroppable
  // This component just provides draggable modules

  const filteredTemplates = mockTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Module Library
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredTemplates.map((template) => (
          <DraggableModule key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
};

