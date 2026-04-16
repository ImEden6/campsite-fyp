/**
 * MapsListPage
 * List and manage campsite maps
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Plus, Edit } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

const MapsListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleOpenMapEditor = (mapId: string = 'test-map-1') => {
    navigate(`/admin/map-editor/${mapId}`);
  };

  return (
    <div className="min-h-screen bg-nature-bg dark:bg-night-bg py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Map className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-primary-100">Maps</h1>
              <p className="text-secondary-600 dark:text-secondary-400">Manage campsite maps</p>
            </div>
          </div>
          <Button
            onClick={() => handleOpenMapEditor('new')}
            className="shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Map
          </Button>
        </div>

        {/* Placeholder - replace with actual maps list */}
        <GlassCard className="p-8" intensity="strong">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-6">
              <Map className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="font-heading text-2xl font-semibold text-gray-900 dark:text-primary-100 mb-2">
              Maps List
            </h2>
            <p className="text-secondary-600 dark:text-secondary-400 text-center max-w-md mb-8">
              Maps list functionality coming soon. For now, you can open the map editor directly.
            </p>
            <Button
              onClick={() => handleOpenMapEditor()}
              size="lg"
              className="shadow-lg shadow-primary-600/20"
            >
              <Edit className="w-5 h-5 mr-2" />
              Open Map Editor
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default MapsListPage;
