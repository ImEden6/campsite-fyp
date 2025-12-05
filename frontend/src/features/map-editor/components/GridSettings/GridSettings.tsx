/**
 * Grid Settings Component
 * Allows users to configure grid dimensions and presets
 */

import React, { useState, useEffect } from 'react';
import { X, Grid3X3 } from 'lucide-react';
import { useMapService } from '../../hooks/useMapService';
import { GRID_PRESETS, type PresetKey } from '../../constants/gridPresets';
import type { Size } from '@/types';

interface GridSettingsProps {
  mapId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GridSettings: React.FC<GridSettingsProps> = ({
  mapId,
  isOpen,
  onClose,
}) => {
  const mapService = useMapService();
  const map = mapService.getMap(mapId);

  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('CUSTOM');
  const [gridWidth, setGridWidth] = useState<number>(map?.gridBounds?.width || map?.imageSize.width || 1920);
  const [gridHeight, setGridHeight] = useState<number>(map?.gridBounds?.height || map?.imageSize.height || 1080);
  const [isCustom, setIsCustom] = useState(true);

  // Initialize from map
  useEffect(() => {
    if (map) {
      const bounds = map.gridBounds || map.imageSize;
      setGridWidth(bounds.width);
      setGridHeight(bounds.height);
      
      // Check if current dimensions match a preset
      const matchingPreset = Object.entries(GRID_PRESETS).find(
        ([key, preset]) =>
          key !== 'CUSTOM' &&
          preset.width === bounds.width &&
          preset.height === bounds.height
      );
      
      if (matchingPreset) {
        setSelectedPreset(matchingPreset[0] as PresetKey);
        setIsCustom(false);
      } else {
        setSelectedPreset('CUSTOM');
        setIsCustom(true);
      }
    }
  }, [map]);

  const handlePresetChange = (preset: PresetKey) => {
    setSelectedPreset(preset);
    
    if (preset === 'CUSTOM') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      const presetData = GRID_PRESETS[preset];
      setGridWidth(presetData.width);
      setGridHeight(presetData.height);
    }
  };

  const handleApply = () => {
    if (!map) return;

    const newGridBounds: Size = {
      width: gridWidth,
      height: gridHeight,
    };

    // Update map with new grid bounds
    mapService.updateMap(mapId, {
      gridBounds: newGridBounds,
      updatedAt: new Date(),
    });

    onClose();
  };

  const handleReset = () => {
    if (!map) return;
    
    // Reset to image size
    setGridWidth(map.imageSize.width);
    setGridHeight(map.imageSize.height);
    setSelectedPreset('CUSTOM');
    setIsCustom(true);
  };

  if (!isOpen || !map) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Grid3X3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Grid Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure grid dimensions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(GRID_PRESETS) as PresetKey[]).map((key) => {
              const preset = GRID_PRESETS[key];
              return (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedPreset === key
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  {key !== 'CUSTOM' && (
                    <div className="text-xs opacity-75">{preset.description}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grid Width (pixels)
            </label>
            <input
              type="number"
              value={gridWidth}
              onChange={(e) => {
                const value = Math.max(100, parseInt(e.target.value) || 100);
                setGridWidth(value);
                if (selectedPreset !== 'CUSTOM') {
                  setSelectedPreset('CUSTOM');
                  setIsCustom(true);
                }
              }}
              min={100}
              max={50000}
              disabled={!isCustom}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grid Height (pixels)
            </label>
            <input
              type="number"
              value={gridHeight}
              onChange={(e) => {
                const value = Math.max(100, parseInt(e.target.value) || 100);
                setGridHeight(value);
                if (selectedPreset !== 'CUSTOM') {
                  setSelectedPreset('CUSTOM');
                  setIsCustom(true);
                }
              }}
              min={100}
              max={50000}
              disabled={!isCustom}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Current Image Size Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
            Image size: {map.imageSize.width} × {map.imageSize.height} px
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Reset to Image Size
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

