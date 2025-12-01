/**
 * ResponsiveChart Component
 * Wrapper for charts that adapts to mobile screens
 */

import React, { useRef, useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/utils/cn';

export interface ResponsiveChartProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  mobileHeight?: number;
  desktopHeight?: number;
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  children,
  className,
  minHeight = 200,
  mobileHeight = 250,
  desktopHeight = 400,
}) => {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = isMobile ? mobileHeight : desktopHeight;
        setDimensions({ width, height: Math.max(height, minHeight) });
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isMobile, mobileHeight, desktopHeight, minHeight]);

  return (
    <div
      ref={containerRef}
      className={cn('w-full', className)}
      style={{ height: dimensions.height }}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{ width?: number; height?: number }>,
            {
              width: dimensions.width,
              height: dimensions.height,
            }
          );
        }
        return child;
      })}
    </div>
  );
};

export default ResponsiveChart;
