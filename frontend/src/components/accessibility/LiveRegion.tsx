import React, { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  clearOnUnmount?: boolean;
  atomic?: boolean;
}

/**
 * LiveRegion component announces dynamic content changes to screen readers
 * Useful for status updates, notifications, and form validation messages
 */
const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  politeness = 'polite',
  clearOnUnmount = true,
  atomic = true,
}) => {
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const regionElement = regionRef.current;

    return () => {
      if (clearOnUnmount && regionElement) {
        regionElement.textContent = '';
      }
    };
  }, [clearOnUnmount]);

  return (
    <div
      ref={regionRef}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {message}
    </div>
  );
};

export default LiveRegion;
