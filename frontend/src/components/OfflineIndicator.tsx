import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@hooks/usePWA';
import { useEffect, useState } from 'react';

export const OfflineIndicator = () => {
  const { isOffline } = usePWA();
  const [showIndicator, setShowIndicator] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setShowIndicator(true);
      setWasOffline(true);
    } else if (wasOffline) {
      // Show "back online" message briefly
      setShowIndicator(true);
      const timer = setTimeout(() => {
        setShowIndicator(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOffline, wasOffline]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down">
      <div
        className={`${isOffline
            ? 'bg-orange-500'
            : 'bg-emerald-500'
          } text-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2`}
      >
        {isOffline ? (
          <>
            <WifiOff className="w-5 h-5" />
            <span className="font-medium">You are offline</span>
          </>
        ) : (
          <>
            <Wifi className="w-5 h-5" />
            <span className="font-medium">Back online</span>
          </>
        )}
      </div>
    </div>
  );
};
