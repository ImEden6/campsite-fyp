/**
 * Properties Panel
 * Comprehensive panel for editing selected module properties
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Settings,
  Move,
  Info,
  AlertCircle,
  Search
} from 'lucide-react';
import { useEditorService } from '../../hooks/useEditorService';
import { useMapService } from '../../hooks/useMapService';
import { useMapCommands } from '../../hooks/useMapCommands';
import type { AnyModule, ModuleType, CampsiteModule, ToiletModule, StorageModule } from '@/types';
import { validatePropertyValue, getUserFriendlyMessage } from '@/utils/validationUtils';
import errorLogger, { ErrorCategory } from '@/utils/errorLogger';

interface PropertiesPanelProps {
  mapId: string;
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
}

const FormField: React.FC<FormFieldProps> = ({ label, children, description, error }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
    {description && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    )}
    {error && (
      <p className="text-xs text-red-600 dark:text-red-400 flex items-center">
        <AlertCircle className="w-3 h-3 mr-1" />
        {error}
      </p>
    )}
  </div>
);

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  children,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        )}
      </button>
     
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
          >
            <div className="space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Type guard functions
const isCampsiteModule = (module: AnyModule): module is CampsiteModule => {
  return module.type === 'campsite';
};

const isToiletModule = (module: AnyModule): module is ToiletModule => {
  return module.type === 'toilet';
};

const isStorageModule = (module: AnyModule): module is StorageModule => {
  return module.type === 'storage';
};

// Helper to safely get metadata property
const getMetadataProperty = <T,>(
  module: AnyModule | null | undefined,
  property: string,
  defaultValue: T
): T => {
  if (!module || !module.metadata) return defaultValue;
  const value = module.metadata[property as keyof typeof module.metadata];
  return value !== undefined ? (value as T) : defaultValue;
};

// Helper function to validate and get user-friendly error message
const validateAndGetError = (property: string, value: unknown, moduleType?: ModuleType): string | null => {
  const result = validatePropertyValue(property, value, moduleType);
 
  if (!result.isValid && result.errors.length > 0) {
    const firstError = result.errors[0];
    if (!firstError) return null;
   
    const userFriendlyMsg = getUserFriendlyMessage(firstError.code);
    return userFriendlyMsg !== 'An error occurred. Please check your input.'
      ? userFriendlyMsg
      : firstError.message;
  }
 
  return null;
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ mapId }) => {
  const { selection, selectModules } = useEditorService();
  const mapService = useMapService();
  const { addModule, deleteModules } = useMapCommands();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const modules = mapService.getModules(mapId);
  const selectedModules = React.useMemo(
    () => modules.filter((m) => selection.includes(m.id)),
    [modules, selection]
  );
  const selectedModule = selectedModules.length === 1 ? selectedModules[0] : null;
  const multipleSelected = selectedModules.length > 1;

  // Debug selection state
  React.useEffect(() => {
    if (selection.length > 0) {
      console.log('[PropertiesPanel] Module selected:', {
        selectionIds: selection,
        modulesFound: selectedModules.map(m => ({ id: m.id, name: m.metadata?.name || m.type })),
        totalModules: modules.length,
      });
    }
  }, [selection, selectedModules, modules.length]);

  const handlePropertyChange = async (property: string, value: unknown) => {
    if (!selectedModule) return;
   
    try {
      // Validate the property value
      const validationError = validateAndGetError(property, value, selectedModule.type);
      if (validationError) {
        setErrors(prev => ({ ...prev, [property]: validationError }));
       
        errorLogger.warn(
          ErrorCategory.VALIDATION,
          'Property validation failed',
          { property, value, moduleId: selectedModule.id, error: validationError }
        );
       
        return;
      }
     
      // Handle position and size as top-level properties
      if (property === 'position' || property === 'size') {
        const updated: AnyModule = {
          ...selectedModule,
          [property]: value,
          updatedAt: new Date(),
        } as AnyModule;

        await mapService.updateModule(mapId, updated);
      } else if (property === 'type' || property === 'locked' || property === 'visible' || property === 'rotation' || property === 'zIndex') {
        // Handle other top-level properties (including type)
        const updated: AnyModule = {
          ...selectedModule,
          [property]: value,
          updatedAt: new Date(),
        } as AnyModule;

        await mapService.updateModule(mapId, updated);
      } else {
        // Other properties go into metadata
        const updated: AnyModule = {
          ...selectedModule,
          metadata: {
            ...selectedModule.metadata,
            [property]: value,
          },
          updatedAt: new Date(),
        } as AnyModule;

        await mapService.updateModule(mapId, updated);
      }
     
      // Clear any errors for this property
      if (errors[property]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[property];
          return newErrors;
        });
      }
     
      errorLogger.info(
        ErrorCategory.PROPERTY,
        'Property updated successfully',
        { property, moduleId: selectedModule.id }
      );
    } catch (error) {
      errorLogger.error(
        ErrorCategory.PROPERTY,
        'Error updating property',
        { property, value, moduleId: selectedModule.id },
        error as Error
      );
     
      setErrors(prev => ({
        ...prev,
        [property]: 'An unexpected error occurred. Please try again.'
      }));
    }
  };

  const handleMetadataChange = async (property: string, value: unknown) => {
    if (!selectedModule) return;
   
    try {
      // Validate the metadata property value
      const validationError = validateAndGetError(property, value, selectedModule.type);
      if (validationError) {
        setErrors(prev => ({ ...prev, [property]: validationError }));
       
        errorLogger.warn(
          ErrorCategory.VALIDATION,
          'Metadata validation failed',
          { property, value, moduleId: selectedModule.id, error: validationError }
        );
       
        return;
      }
     
      const updated: AnyModule = {
        ...selectedModule,
        metadata: {
          ...selectedModule.metadata,
          [property]: value,
        },
        updatedAt: new Date(),
      } as AnyModule;
     
      await mapService.updateModule(mapId, updated);
     
      // Clear any errors for this property
      if (errors[property]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[property];
          return newErrors;
        });
      }
     
      errorLogger.info(
        ErrorCategory.PROPERTY,
        'Metadata updated successfully',
        { property, moduleId: selectedModule.id }
      );
    } catch (error) {
      errorLogger.error(
        ErrorCategory.PROPERTY,
        'Error updating metadata',
        { property, value, moduleId: selectedModule.id },
        error as Error
      );
     
      setErrors(prev => ({
        ...prev,
        [property]: 'An unexpected error occurred. Please try again.'
      }));
    }
  };

  const handleDelete = async () => {
    if (!selectedModule) return;
   
    try {
      await deleteModules(mapId, [selectedModule.id]);
      selectModules([]);
     
      errorLogger.info(
        ErrorCategory.PROPERTY,
        'Module deleted successfully',
        { moduleId: selectedModule.id }
      );
    } catch (error) {
      errorLogger.error(
        ErrorCategory.PROPERTY,
        'Error deleting module',
        { moduleId: selectedModule.id },
        error as Error
      );
    }
  };

  const handleDuplicate = async () => {
    if (!selectedModule) return;
   
    try {
      const duplicatedModule: AnyModule = {
        ...selectedModule,
        id: `${selectedModule.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: selectedModule.position.x + 20,
          y: selectedModule.position.y + 20,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
     
      await addModule(mapId, duplicatedModule);
      selectModules([duplicatedModule.id]);
     
      errorLogger.info(
        ErrorCategory.PROPERTY,
        'Module duplicated successfully',
        { originalModuleId: selectedModule.id, duplicatedModuleId: duplicatedModule.id }
      );
    } catch (error) {
      errorLogger.error(
        ErrorCategory.PROPERTY,
        'Error duplicating module',
        { moduleId: selectedModule.id },
        error as Error
      );
    }
  };

  const handleToggleLock = () => {
    if (!selectedModule) return;
    handlePropertyChange('locked', !selectedModule.locked);
  };

  const handleToggleVisibility = () => {
    if (!selectedModule) return;
    handlePropertyChange('visible', !selectedModule.visible);
  };

  const renderBasicProperties = () => {
    if (!selectedModule) return null;
    const moduleName = getMetadataProperty<string>(selectedModule, 'name', '');
    return (
      <CollapsibleSection title="Basic Properties" icon={Settings}>
        <FormField
          label="Name"
          error={errors.name}
        >
          <input
            type="text"
            value={moduleName}
            onChange={(e) => {
              const value = e.target.value;
              handleMetadataChange('name', value);
            }}
            className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter module name"
          />
        </FormField>
        <FormField label="Type">
          <select
            value={selectedModule.type}
            onChange={(e) => handlePropertyChange('type', e.target.value as ModuleType)}
            className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="campsite">Campsite</option>
            <option value="toilet">Toilet</option>
            <option value="storage">Storage</option>
            <option value="building">Building</option>
            <option value="parking">Parking</option>
            <option value="road">Road</option>
            <option value="water_source">Water Source</option>
            <option value="electricity">Electricity</option>
            <option value="waste_disposal">Waste Disposal</option>
            <option value="recreation">Recreation</option>
            <option value="custom">Custom</option>
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Visible">
            <button
              onClick={handleToggleVisibility}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border w-full justify-center ${
                selectedModule.visible
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-600 text-green-800 dark:text-green-200'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {selectedModule.visible ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="text-sm">{selectedModule.visible ? 'Visible' : 'Hidden'}</span>
            </button>
          </FormField>
          <FormField label="Locked">
            <button
              onClick={handleToggleLock}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md border w-full justify-center ${
                selectedModule.locked
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-600 text-red-800 dark:text-red-200'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {selectedModule.locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span className="text-sm">{selectedModule.locked ? 'Locked' : 'Unlocked'}</span>
            </button>
          </FormField>
        </div>
      </CollapsibleSection>
    );
  };

  const renderTransformProperties = () => {
    if (!selectedModule) return null;
    return (
      <CollapsibleSection title="Transform" icon={Move}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="X Position" error={errors.position}>
            <input
              type="number"
              value={Math.round(selectedModule.position.x)}
              onChange={(e) => handlePropertyChange('position', {
                ...selectedModule.position,
                x: parseFloat(e.target.value) || 0,
              })}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </FormField>
          <FormField label="Y Position" error={errors.position}>
            <input
              type="number"
              value={Math.round(selectedModule.position.y)}
              onChange={(e) => handlePropertyChange('position', {
                ...selectedModule.position,
                y: parseFloat(e.target.value) || 0,
              })}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Width" error={errors.size}>
            <input
              type="number"
              value={Math.round(selectedModule.size.width)}
              onChange={(e) => handlePropertyChange('size', {
                ...selectedModule.size,
                width: parseFloat(e.target.value) || 0,
              })}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="20"
            />
          </FormField>
          <FormField label="Height" error={errors.size}>
            <input
              type="number"
              value={Math.round(selectedModule.size.height)}
              onChange={(e) => handlePropertyChange('size', {
                ...selectedModule.size,
                height: parseFloat(e.target.value) || 0,
              })}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="20"
            />
          </FormField>
        </div>
        <FormField label="Rotation" error={errors.rotation}>
          <input
            type="range"
            min="0"
            max="360"
            value={selectedModule.rotation || 0}
            onChange={(e) => handlePropertyChange('rotation', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0°</span>
            <span>{selectedModule.rotation || 0}°</span>
            <span>360°</span>
          </div>
        </FormField>
        <FormField label="Z-Index" error={errors.zIndex}>
          <input
            type="number"
            value={selectedModule.zIndex || 0}
            onChange={(e) => handlePropertyChange('zIndex', parseInt(e.target.value) || 0)}
            className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            min="0"
          />
        </FormField>
      </CollapsibleSection>
    );
  };

  const renderTypeSpecificProperties = () => {
    if (!selectedModule) return null;
    if (isCampsiteModule(selectedModule)) {
      const capacity = selectedModule.metadata.capacity || 0;
      const basePrice = selectedModule.metadata.pricing?.basePrice || 0;
      const electricHookup = selectedModule.metadata.electricHookup || false;
      const waterHookup = selectedModule.metadata.waterHookup || false;
      const sewerHookup = selectedModule.metadata.sewerHookup || false;
      return (
        <CollapsibleSection title="Campsite Properties" icon={Info}>
          <FormField label="Capacity" error={errors.capacity}>
            <input
              type="number"
              value={capacity}
              onChange={(e) => handleMetadataChange('capacity', parseInt(e.target.value) || 0)}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="1"
            />
          </FormField>
          <FormField label="Base Price" error={errors.pricing}>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => handleMetadataChange('pricing', {
                ...(selectedModule.metadata.pricing || { seasonalMultiplier: 1.0 }),
                basePrice: parseFloat(e.target.value) || 0,
              })}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="0"
              step="0.01"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-2">
            <FormField label="Hookups">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={electricHookup}
                    onChange={(e) => handleMetadataChange('electricHookup', e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Electric Hookup</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={waterHookup}
                    onChange={(e) => handleMetadataChange('waterHookup', e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Water Hookup</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={sewerHookup}
                    onChange={(e) => handleMetadataChange('sewerHookup', e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Sewer Hookup</span>
                </label>
              </div>
            </FormField>
          </div>
        </CollapsibleSection>
      );
    }
    if (isToiletModule(selectedModule)) {
      const capacity = selectedModule.metadata.capacity || 0;
      const maintenanceSchedule = selectedModule.metadata.maintenanceSchedule || '';
      const accessible = selectedModule.metadata.accessible || false;
      return (
        <CollapsibleSection title="Toilet Properties" icon={Info}>
          <FormField label="Capacity" error={errors.capacity}>
            <input
              type="number"
              value={capacity}
              onChange={(e) => handleMetadataChange('capacity', parseInt(e.target.value) || 0)}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="1"
            />
          </FormField>
          <FormField label="Maintenance Schedule">
            <select
              value={maintenanceSchedule}
              onChange={(e) => handleMetadataChange('maintenanceSchedule', e.target.value)}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select schedule</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Bi-weekly">Bi-weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </FormField>
          <FormField label="Accessible">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={accessible}
                onChange={(e) => handleMetadataChange('accessible', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">ADA Accessible</span>
            </label>
          </FormField>
        </CollapsibleSection>
      );
    }
    if (isStorageModule(selectedModule)) {
      const storageType = selectedModule.metadata.storageType || '';
      const capacity = selectedModule.metadata.capacity || 0;
      const accessLevel = selectedModule.metadata.accessLevel || '';
      return (
        <CollapsibleSection title="Storage Properties" icon={Info}>
          <FormField label="Storage Type">
            <select
              value={storageType}
              onChange={(e) => handleMetadataChange('storageType', e.target.value)}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select type</option>
              <option value="equipment">Equipment</option>
              <option value="maintenance">Maintenance</option>
              <option value="general">General</option>
            </select>
          </FormField>
          <FormField label="Capacity (units)" error={errors.capacity}>
            <input
              type="number"
              value={capacity}
              onChange={(e) => handleMetadataChange('capacity', parseInt(e.target.value) || 0)}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              min="0"
            />
          </FormField>
          <FormField label="Access Level">
            <select
              value={accessLevel}
              onChange={(e) => handleMetadataChange('accessLevel', e.target.value)}
              className="input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select access level</option>
              <option value="public">Public</option>
              <option value="staff">Staff Only</option>
              <option value="admin">Admin Only</option>
            </select>
          </FormField>
        </CollapsibleSection>
      );
    }
    return null;
  };

  const renderMultipleSelectionPanel = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Multiple Selection ({selectedModules.length})
        </h3>
        <button
          onClick={() => selectModules([])}
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedModules.length} modules selected
        </div>
       
        <div className="flex flex-wrap gap-2">
          {selectedModules.map(module => {
            const moduleName = getMetadataProperty<string>(module, 'name', module.type);
            return (
              <span
                key={module.id}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
              >
                {moduleName}
              </span>
            );
          })}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={async () => {
              const moduleIds = selectedModules.map(m => m.id);
              await deleteModules(mapId, moduleIds);
              selectModules([]);
            }}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Delete All
          </button>
        </div>
      </div>
    </div>
  );

  if (selectedModules.length === 0) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center p-8">
          <Settings className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Select a module to edit its properties</p>
        </div>
      </div>
    );
  }

  if (multipleSelected) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        {renderMultipleSelectionPanel()}
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedModule?.type === 'campsite' ? '#3B82F6' : '#6B7280' }}
            >
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Properties</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getMetadataProperty<string>(selectedModule, 'name', selectedModule?.type || '')}
              </p>
            </div>
          </div>
          <button
            onClick={() => selectModules([])}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {searchTerm ? (
          <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Search results for &quot;{searchTerm}&quot;
            </p>
            {(() => {
              const searchLower = searchTerm.toLowerCase();
              const matchesSearch = (text: string) => text.toLowerCase().includes(searchLower);
              
              if (matchesSearch('name') || matchesSearch('type') || matchesSearch('visible') || matchesSearch('locked') || 
                  matchesSearch('position') || matchesSearch('x') || matchesSearch('y') || matchesSearch('width') || 
                  matchesSearch('height') || matchesSearch('rotation') || matchesSearch('z-index') || searchTerm.length < 2) {
                return (
                  <>
                    {renderBasicProperties()}
                    {renderTransformProperties()}
                    {renderTypeSpecificProperties()}
                  </>
                );
              }
              
              return (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No properties match your search</p>
                </div>
              );
            })()}
          </div>
        ) : (
          <>
            {renderBasicProperties()}
            {renderTransformProperties()}
            {renderTypeSpecificProperties()}
          </>
        )}
      </div>
      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleDuplicate}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Copy className="w-4 h-4 mr-2 inline" />
            Duplicate
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-3 py-2 text-sm font-medium rounded-md border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-2 inline" />
            Delete
          </button>
        </div>
       
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Double-click module to edit inline
        </div>
      </div>
    </div>
  );
};
