import React, { useRef, useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Car, 
  Building, 
  Trash2, 
  Droplets, 
  Zap, 
  TreePine, 
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Package,
  MapPin,
  Settings
} from 'lucide-react';
import { ModuleType, ModuleTemplate } from '@/types';

interface DraggableModuleProps {
  template: ModuleTemplate;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const DraggableModule: React.FC<DraggableModuleProps> = ({ template, onDragStart, onDragEnd }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `module-${template.id}`,
    data: {
      template,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Handle drag start/end callbacks
  const wasDragging = useRef(false);
  useEffect(() => {
    if (isDragging && !wasDragging.current) {
      wasDragging.current = true;
      onDragStart();
    } else if (!isDragging && wasDragging.current) {
      wasDragging.current = false;
      onDragEnd();
    }
  }, [isDragging, onDragStart, onDragEnd]);

  const getModuleIcon = (type: ModuleType) => {
    const iconMap = {
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
      custom: Settings,
    };
    return iconMap[type] || Settings;
  };

  const Icon = getModuleIcon(template.type);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`module-item p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow cursor-move ${isDragging ? 'dragging' : ''}`}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
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
      
      {template.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {template.tags.slice(0, 3).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

interface ModuleCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  expanded: boolean;
}

const ModuleLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [categories, setCategories] = useState<ModuleCategory[]>([
    { id: 'accommodation', name: 'Accommodation', icon: Home, color: '#3B82F6', expanded: true },
    { id: 'facilities', name: 'Facilities', icon: Building, color: '#8B5CF6', expanded: true },
    { id: 'utilities', name: 'Utilities', icon: Zap, color: '#F59E0B', expanded: false },
    { id: 'recreation', name: 'Recreation', icon: TreePine, color: '#10B981', expanded: false },
    { id: 'infrastructure', name: 'Infrastructure', icon: MapPin, color: '#6B7280', expanded: false },
  ]);

  // Mock module templates
  const moduleTemplates: ModuleTemplate[] = [
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

  const filteredTemplates = moduleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedTemplates = categories.reduce((acc, category) => {
    acc[category.id] = filteredTemplates.filter(template => template.category === category.id);
    return acc;
  }, {} as Record<string, ModuleTemplate[]>);

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => 
      prev.map(cat => 
        cat.id === categoryId 
          ? { ...cat, expanded: !cat.expanded }
          : cat
      )
    );
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="sidebar bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="sidebar-header border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Module Library</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Drag modules onto your map</p>
      </div>

      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              !selectedCategory 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-body scrollbar-thin">
        <AnimatePresence>
          {categories.map(category => {
            const templates = groupedTemplates[category.id] || [];
            const Icon = category.icon;
            
            if (templates.length === 0 && selectedCategory !== category.id) {
              return null;
            }

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({templates.length})
                    </span>
                  </div>
                  {category.expanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {category.expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-4 mt-2 space-y-2"
                    >
                      {templates.map(template => (
                        <DraggableModule
                          key={template.id}
                          template={template}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No modules found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      <div className="sidebar-footer border-t border-gray-200 dark:border-gray-700">
        <button className="btn-outline w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Module
        </button>
      </div>

      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/5 dark:bg-blue-400/5 z-40 pointer-events-none" />
      )}
    </div>
  );
};

export default ModuleLibrary;
