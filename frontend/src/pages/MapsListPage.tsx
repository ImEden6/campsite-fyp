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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GlassCard 
            className="overflow-hidden group cursor-pointer border-nature-200/50 dark:border-night-surface-alt" 
            intensity="strong"
            onClick={() => handleOpenMapEditor('main-map')}
          >
            <div className="h-48 bg-nature-100 dark:bg-night-surface-alt relative overflow-hidden">
              <img 
                src="/images/map.png" 
                alt="Main Map Preview" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-sm font-medium flex items-center gap-2">
                  <Edit className="w-4 h-4" /> Edit Layout
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-primary-100">
                  Main Campsite Map
                </h2>
              </div>
              <p className="text-secondary-600 dark:text-secondary-400 text-sm mb-4">
                Primary site layout with 8 sites, lake and forest areas.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-secondary-500">Last updated: Just now</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMapEditor('main-map');
                  }}
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Open
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default MapsListPage;
