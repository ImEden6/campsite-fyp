/**
 * MapGrid Component
 * Renders a grid overlay on the Konva canvas.
 */

import React, { useMemo } from 'react';
import { Line, Group } from 'react-konva';

interface MapGridProps {
    width: number;
    height: number;
    gridSize: number;
    zoom: number;
    offset: { x: number; y: number };
}

export const MapGrid: React.FC<MapGridProps> = ({
    width,
    height,
    gridSize,
    zoom,
    offset,
}) => {
    // Calculate visible grid lines based on viewport
    const lines = useMemo(() => {
        const result: React.ReactNode[] = [];

        // Adjust grid size based on zoom for better visibility
        let displayGridSize = gridSize;
        if (zoom < 0.3) {
            displayGridSize = gridSize * 4;
        } else if (zoom < 0.6) {
            displayGridSize = gridSize * 2;
        }

        // Calculate the visible area in canvas coordinates
        const visibleLeft = -offset.x / zoom;
        const visibleTop = -offset.y / zoom;
        const visibleRight = (width - offset.x) / zoom;
        const visibleBottom = (height - offset.y) / zoom;

        // Add padding to ensure we cover the visible area
        const padding = displayGridSize * 2;
        const startX = Math.floor((visibleLeft - padding) / displayGridSize) * displayGridSize;
        const endX = Math.ceil((visibleRight + padding) / displayGridSize) * displayGridSize;
        const startY = Math.floor((visibleTop - padding) / displayGridSize) * displayGridSize;
        const endY = Math.ceil((visibleBottom + padding) / displayGridSize) * displayGridSize;

        // Vertical lines
        for (let x = startX; x <= endX; x += displayGridSize) {
            const isMajor = x % (displayGridSize * 5) === 0;
            result.push(
                <Line
                    key={`v-${x}`}
                    points={[x, startY, x, endY]}
                    stroke={isMajor ? 'rgba(100, 100, 100, 0.4)' : 'rgba(150, 150, 150, 0.2)'}
                    strokeWidth={isMajor ? 1 / zoom : 0.5 / zoom}
                    listening={false}
                />
            );
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += displayGridSize) {
            const isMajor = y % (displayGridSize * 5) === 0;
            result.push(
                <Line
                    key={`h-${y}`}
                    points={[startX, y, endX, y]}
                    stroke={isMajor ? 'rgba(100, 100, 100, 0.4)' : 'rgba(150, 150, 150, 0.2)'}
                    strokeWidth={isMajor ? 1 / zoom : 0.5 / zoom}
                    listening={false}
                />
            );
        }

        return result;
    }, [width, height, gridSize, zoom, offset]);

    return <Group listening={false}>{lines}</Group>;
};

export default MapGrid;
