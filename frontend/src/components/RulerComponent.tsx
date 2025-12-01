/**
 * RulerComponent
 * Displays measurement rulers along the canvas edges
 */

import React, { useMemo } from 'react';
import { memoize } from '@/utils/performanceUtils';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
  length: number;
  zoom: number;
  offset: number;
}

// Memoize mark interval calculation
const getMarkIntervals = memoize((zoom: number) => {
  const baseMinorInterval = 20;
  const baseMajorInterval = 100;
  
  // Adjust intervals based on zoom level
  let minorInterval = baseMinorInterval;
  let majorInterval = baseMajorInterval;
  
  if (zoom < 0.5) {
    minorInterval = 100;
    majorInterval = 500;
  } else if (zoom < 1) {
    minorInterval = 50;
    majorInterval = 200;
  } else if (zoom > 2) {
    minorInterval = 10;
    majorInterval = 50;
  }
  
  return { minorInterval, majorInterval };
});

const RulerComponent: React.FC<RulerProps> = ({
  orientation,
  length,
  zoom,
  offset,
}) => {
  // Memoize mark calculations to avoid recalculating on every render
  const marks = useMemo(() => {
    const { minorInterval, majorInterval } = getMarkIntervals(zoom);
    
    // Calculate the visible range based on offset and zoom
    const startPos = Math.floor(-offset / zoom / minorInterval) * minorInterval;
    const endPos = startPos + Math.ceil(length / zoom) + minorInterval;
    
    // Generate marks
    const result: Array<{ position: number; isMajor: boolean; label?: string }> = [];
    
    for (let pos = startPos; pos <= endPos; pos += minorInterval) {
      const isMajor = pos % majorInterval === 0;
      const screenPos = pos * zoom + offset;
      
      // Only render marks that are visible on screen
      if (screenPos >= 0 && screenPos <= length) {
        result.push({
          position: screenPos,
          isMajor,
          label: isMajor ? `${pos}` : undefined,
        });
      }
    }
    
    return result;
  }, [zoom, offset, length]);
  
  const isHorizontal = orientation === 'horizontal';
  const rulerSize = 24; // Height for horizontal, width for vertical
  
  const isDark = document.documentElement.classList.contains('dark');
  
  return (
    <div
      className={`absolute bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 ${
        isHorizontal
          ? 'top-0 left-0 right-0 border-b'
          : 'top-0 left-0 bottom-0 border-r'
      }`}
      style={{
        [isHorizontal ? 'height' : 'width']: `${rulerSize}px`,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <svg
        width={isHorizontal ? length : rulerSize}
        height={isHorizontal ? rulerSize : length}
        style={{ display: 'block' }}
      >
        {marks.map((mark, index) => {
          const x1 = isHorizontal ? mark.position : (mark.isMajor ? 0 : rulerSize * 0.4);
          const y1 = isHorizontal ? (mark.isMajor ? 0 : rulerSize * 0.4) : mark.position;
          const x2 = isHorizontal ? mark.position : rulerSize;
          const y2 = isHorizontal ? rulerSize : mark.position;
          
          return (
            <g key={`mark-${index}`}>
              {/* Mark line */}
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={mark.isMajor ? (isDark ? '#D1D5DB' : '#374151') : (isDark ? '#6B7280' : '#9CA3AF')}
                strokeWidth={mark.isMajor ? 1.5 : 1}
              />
              
              {/* Label for major marks */}
              {mark.label && (
                <text
                  x={isHorizontal ? mark.position : rulerSize * 0.5}
                  y={isHorizontal ? rulerSize * 0.65 : mark.position}
                  fontSize="9"
                  fill={isDark ? '#D1D5DB' : '#374151'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={
                    isHorizontal
                      ? undefined
                      : `rotate(-90, ${rulerSize * 0.5}, ${mark.position})`
                  }
                  style={{ pointerEvents: 'none', fontFamily: 'monospace' }}
                >
                  {mark.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default React.memo(RulerComponent, (prevProps, nextProps) => {
  // Only re-render if ruler parameters change significantly
  return (
    prevProps.orientation === nextProps.orientation &&
    prevProps.length === nextProps.length &&
    Math.abs(prevProps.zoom - nextProps.zoom) < 0.01 &&
    Math.abs(prevProps.offset - nextProps.offset) < 1
  );
});
