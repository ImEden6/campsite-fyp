/**
 * Rulers Component
 * Horizontal and vertical pixel rulers with guide creation via drag.
 * Toggled with R key, guides can be dragged into canvas.
 */

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useEditorStore } from '@/stores';

// ============================================================================
// TYPES
// ============================================================================

interface RulersProps {
    canvasWidth: number;
    canvasHeight: number;
    zoom: number;
    panX: number;
    panY: number;
}

interface RulerProps {
    orientation: 'horizontal' | 'vertical';
    length: number;
    zoom: number;
    pan: number;
    onGuideCreate: (position: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RULER_SIZE = 20; // pixels
const TICK_SMALL = 10;
const TICK_MEDIUM = 50;
const TICK_LARGE = 100;

// ============================================================================
// SINGLE RULER COMPONENT
// ============================================================================

function Ruler({
    orientation,
    length,
    zoom,
    pan,
    onGuideCreate,
}: RulerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState<number | null>(null);

    const isHorizontal = orientation === 'horizontal';

    // Draw ruler ticks and numbers
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasLength = isHorizontal ? length : RULER_SIZE;
        const canvasWidth = isHorizontal ? RULER_SIZE : length;

        // Set canvas size accounting for DPR
        canvas.width = canvasLength * dpr;
        canvas.height = canvasWidth * dpr;
        ctx.scale(dpr, dpr);

        // Clear
        ctx.fillStyle = 'var(--ruler-bg, #1e1e2e)';
        ctx.fillRect(0, 0, canvasLength, canvasWidth);

        // Draw ticks
        ctx.fillStyle = 'var(--ruler-text, #cdd6f4)';
        ctx.strokeStyle = 'var(--ruler-tick, #6c7086)';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';

        // Calculate visible range
        const startPos = Math.floor(-pan / zoom / TICK_SMALL) * TICK_SMALL;
        const endPos = Math.ceil((length - pan) / zoom / TICK_SMALL) * TICK_SMALL;

        for (let pos = startPos; pos <= endPos; pos += TICK_SMALL) {
            const screenPos = pos * zoom + pan;

            if (screenPos < 0 || screenPos > length) continue;

            let tickHeight: number;
            let showLabel = false;

            if (pos % TICK_LARGE === 0) {
                tickHeight = isHorizontal ? 14 : 14;
                showLabel = true;
            } else if (pos % TICK_MEDIUM === 0) {
                tickHeight = isHorizontal ? 10 : 10;
            } else {
                tickHeight = isHorizontal ? 6 : 6;
            }

            ctx.beginPath();
            if (isHorizontal) {
                ctx.moveTo(screenPos, RULER_SIZE);
                ctx.lineTo(screenPos, RULER_SIZE - tickHeight);
            } else {
                ctx.moveTo(RULER_SIZE, screenPos);
                ctx.lineTo(RULER_SIZE - tickHeight, screenPos);
            }
            ctx.stroke();

            if (showLabel && zoom > 0.3) {
                if (isHorizontal) {
                    ctx.fillText(String(pos), screenPos, RULER_SIZE - 15);
                } else {
                    ctx.save();
                    ctx.translate(RULER_SIZE - 15, screenPos);
                    ctx.rotate(-Math.PI / 2);
                    ctx.fillText(String(pos), 0, 0);
                    ctx.restore();
                }
            }
        }

        // Draw drag indicator
        if (isDragging && dragPosition !== null) {
            ctx.strokeStyle = 'var(--guide-color, #00bcd4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (isHorizontal) {
                ctx.moveTo(dragPosition, 0);
                ctx.lineTo(dragPosition, RULER_SIZE);
            } else {
                ctx.moveTo(0, dragPosition);
                ctx.lineTo(RULER_SIZE, dragPosition);
            }
            ctx.stroke();
        }
    }, [length, zoom, pan, isHorizontal, isDragging, dragPosition]);

    // Handle drag to create guide
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const pos = isHorizontal
                ? e.clientX - rect.left
                : e.clientY - rect.top;
            setDragPosition(pos);
        },
        [isDragging, isHorizontal]
    );

    const handleMouseUp = useCallback(() => {
        if (isDragging && dragPosition !== null) {
            // Convert screen position to canvas position
            const canvasPos = (dragPosition - pan) / zoom;
            onGuideCreate(canvasPos);
        }
        setIsDragging(false);
        setDragPosition(null);
    }, [isDragging, dragPosition, pan, zoom, onGuideCreate]);

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false);
        setDragPosition(null);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className={`ruler ruler--${orientation}`}
            style={{
                width: isHorizontal ? length : RULER_SIZE,
                height: isHorizontal ? RULER_SIZE : length,
                cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Rulers({
    canvasWidth,
    canvasHeight,
    zoom,
    panX,
    panY,
}: RulersProps) {
    const { showRulers, addGuide } = useEditorStore();

    const handleHorizontalGuideCreate = useCallback(
        (position: number) => {
            // Horizontal ruler (top) creates VERTICAL guides (lines that run up/down at X position)
            addGuide('vertical', position);
        },
        [addGuide]
    );

    const handleVerticalGuideCreate = useCallback(
        (position: number) => {
            // Vertical ruler (left) creates HORIZONTAL guides (lines that run left/right at Y position)
            addGuide('horizontal', position);
        },
        [addGuide]
    );

    if (!showRulers) {
        return null;
    }

    return (
        <>
            {/* Corner square */}
            <div
                className="ruler-corner"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: RULER_SIZE,
                    height: RULER_SIZE,
                    backgroundColor: 'var(--ruler-bg, #1e1e2e)',
                    zIndex: 100,
                }}
            />

            {/* Horizontal ruler (top) */}
            <div
                className="ruler-container ruler-container--horizontal"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: RULER_SIZE,
                    height: RULER_SIZE,
                    zIndex: 99,
                }}
            >
                <Ruler
                    orientation="horizontal"
                    length={canvasWidth}
                    zoom={zoom}
                    pan={panX}
                    onGuideCreate={handleHorizontalGuideCreate}
                />
            </div>

            {/* Vertical ruler (left) */}
            <div
                className="ruler-container ruler-container--vertical"
                style={{
                    position: 'absolute',
                    top: RULER_SIZE,
                    left: 0,
                    width: RULER_SIZE,
                    zIndex: 99,
                }}
            >
                <Ruler
                    orientation="vertical"
                    length={canvasHeight}
                    zoom={zoom}
                    pan={panY}
                    onGuideCreate={handleVerticalGuideCreate}
                />
            </div>
        </>
    );
}

export { RULER_SIZE };
export default Rulers;
