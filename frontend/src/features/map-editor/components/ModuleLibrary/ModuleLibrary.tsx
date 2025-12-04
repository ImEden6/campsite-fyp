/**
 * Module Library
 * Sidebar for dragging modules onto the map
 */

import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Home, Building, Package, Car, Droplets, Zap, TreePine, Trash2, Search } from 'lucide-react';
import type { ModuleTemplate, ModuleType } from '@/types';

// Mock templates - in real app, these would come from a service
const mockTemplates: ModuleTemplate[] = [
  {
    id: '1',
    name: 'Standard Campsite',
    description: 'Basic camping spot',
    type: 'campsite',
    defaultSize: { width: 100, height: 100 },
    defaultMetadata: { name: 'Campsite', capacity: 4 },
    icon: 'home',
    color: '#3B82F6',
    category: 'accommodation',
    customizable: true,
    tags: ['basic'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Restroom',
    description: 'Public restroom',
    type: 'toilet',
    defaultSize: { width: 80, height: 120 },
    defaultMetadata: { name: 'Restroom' },
    icon: 'building',
    color: '#8B5CF6',
    category: 'facilities',
    customizable: true,
    tags: ['essential'],
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
      road: Car,
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

