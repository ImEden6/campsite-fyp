import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Plus, Edit } from 'lucide-react';

const MapsListPage: React.FC = () => {
  const navigate = useNavigate();

  // Temporary: Navigate to map editor with a test ID
  // TODO: Replace with actual maps list when implemented
  const handleOpenMapEditor = (mapId: string = 'test-map-1') => {
    console.log('[MapsListPage] Navigating to map editor with ID:', mapId);
    navigate(`/admin/map-editor/${mapId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Maps</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage campsite maps</p>
        </div>
        <button
          onClick={() => handleOpenMapEditor()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Map
        </button>
      </div>

      {/* Temporary placeholder - replace with actual maps list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Map className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Maps List
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
            Maps list functionality coming soon. For now, you can open the map editor directly.
          </p>
          <button
            onClick={() => handleOpenMapEditor('test-map-1')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Edit className="w-5 h-5" />
            Open Map Editor
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapsListPage;
