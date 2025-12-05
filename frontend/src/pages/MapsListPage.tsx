/**
 * Maps List Page
 * View and manage all campsite maps
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazyFramerMotion } from '@/hooks/useLazyFramerMotion';
import { 
  Map, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Upload,
  Calendar
} from 'lucide-react';
import { useMapStore } from '@/stores/mapStore';
import { getImageDimensions } from '@/utils/imageOptimization';
import type { CampsiteMap, Size } from '@/types';

export const MapsListPage: React.FC = () => {
  const { motion } = useLazyFramerMotion();
  const MotionDiv = motion?.div || 'div';
  const navigate = useNavigate();
  const { maps, addMap, removeMap } = useMapStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');
  const [_imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectedImageSize, setDetectedImageSize] = useState<Size | null>(null);

  const handleCreateMap = () => {
    if (!newMapName.trim()) {
      alert('Please enter a map name');
      return;
    }

    // Use detected image size or fallback to default
    const imageSize = detectedImageSize || { width: 1920, height: 1080 };

    // Create a new map
    const newMap: CampsiteMap = {
      id: `map-${Date.now()}`,
      name: newMapName,
      description: newMapDescription,
      imageUrl: imagePreview || '/placeholder-map.jpg',
      imageSize,
      scale: 10, // 10 pixels per meter
      bounds: {
        minX: 0,
        minY: 0,
        maxX: imageSize.width,
        maxY: imageSize.height,
      },
      // Set gridBounds to match image size when image is uploaded
      gridBounds: detectedImageSize ? {
        width: detectedImageSize.width,
        height: detectedImageSize.height,
      } : undefined,
      modules: [],
      metadata: {
        address: '',
        coordinates: { latitude: 0, longitude: 0 },
        timezone: 'America/New_York',
        capacity: 0,
        amenities: [],
        rules: [],
        emergencyContacts: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addMap(newMap);
    setShowCreateDialog(false);
    setNewMapName('');
    setNewMapDescription('');
    setImageFile(null);
    setImagePreview(null);
    setDetectedImageSize(null);
    
    // Navigate to the new map editor
    navigate(`/admin/map-editor/${newMap.id}`);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Detect image dimensions
      try {
        const dimensions = await getImageDimensions(file);
        setDetectedImageSize(dimensions);
      } catch (error) {
        console.error('Failed to detect image dimensions:', error);
        // Fallback to default size
        setDetectedImageSize({ width: 1920, height: 1080 });
      }
      
      // Update preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteMap = (mapId: string) => {
    if (confirm('Are you sure you want to delete this map? This action cannot be undone.')) {
      removeMap(mapId);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Campsite Maps</h1>
          <p className="text-gray-600 dark:text-gray-400">Create and manage your campsite layout maps</p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Map
        </button>
      </div>

      {/* Maps Grid */}
      {maps.length === 0 ? (
        <div className="text-center py-16">
          <Map className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No maps yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first campsite map to get started</p>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Map
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map, index) => (
            <MotionDiv
              key={map.id}
              {...(motion ? {
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: index * 0.1 }
              } : {})}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Map Preview */}
              <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                {map.imageUrl ? (
                  <img 
                    src={map.imageUrl} 
                    alt={map.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Map className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {map.modules.length} modules
                </div>
              </div>

              {/* Map Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {map.name}
                </h3>
                {map.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {map.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mb-4">
                  <Calendar className="w-3 h-3" />
                  Updated {new Date(map.updatedAt).toLocaleDateString()}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/admin/map-editor/${map.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => navigate(`/admin/map-editor/${map.id}`)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="View Map"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMap(map.id)}
                    className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete Map"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      )}

      {/* Create Map Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <MotionDiv
            {...(motion ? {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 }
            } : {})}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Create New Map
            </h2>

            <div className="space-y-4">
              {/* Map Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Map Name *
                </label>
                <input
                  type="text"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="e.g., Main Campground"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newMapDescription}
                  onChange={(e) => setNewMapDescription(e.target.value)}
                  placeholder="Brief description of this map area"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Background Image (Optional)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <div className="space-y-1 text-center">
                    {imagePreview ? (
                      <div className="relative">
                        <img src={imagePreview} alt="Preview" className="mx-auto h-32 rounded" />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setDetectedImageSize(null);
                          }}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateDialog(false);
                  setNewMapName('');
                  setNewMapDescription('');
                  setImageFile(null);
                  setImagePreview(null);
                  setDetectedImageSize(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMap}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Map
              </button>
            </div>
          </MotionDiv>
        </div>
      )}
    </div>
  );
};

export default MapsListPage;
