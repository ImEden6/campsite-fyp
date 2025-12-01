import { RefreshCw } from 'lucide-react';
import { usePWA } from '@hooks/usePWA';

export const PWAUpdatePrompt = () => {
  const { isUpdateAvailable, updateServiceWorker } = usePWA();

  if (!isUpdateAvailable) {
    return null;
  }

  const handleUpdate = async () => {
    await updateServiceWorker();
    window.location.reload();
  };

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-down">
      <div className="bg-blue-500 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5" />
            <h3 className="font-semibold">Update Available</h3>
          </div>
        </div>
        
        <p className="text-sm mb-4 text-blue-50">
          A new version of the app is available. Update now to get the latest features and improvements.
        </p>
        
        <button
          onClick={handleUpdate}
          className="w-full bg-white text-blue-500 hover:bg-blue-50 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Update Now
        </button>
      </div>
    </div>
  );
};
