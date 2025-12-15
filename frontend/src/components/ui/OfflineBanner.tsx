/**
 * Offline Banner Component
 * Displays a banner when the app is using mock data (API unavailable)
 */
import { WifiOff } from 'lucide-react';
import { isUsingMockData } from '@/services/api/mockBookingStore';
import { useState, useEffect } from 'react';

export const OfflineBanner: React.FC = () => {
    // Check once on mount - flag only changes from false to true during session
    const [show, setShow] = useState(isUsingMockData());

    useEffect(() => {
        // Re-check after initial render to catch any API failures during page load
        setShow(isUsingMockData());
    }, []);

    if (!show) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
            <WifiOff size={16} />
            Demo Mode - Bookings are stored locally and will not sync with the server
        </div>
    );
};
