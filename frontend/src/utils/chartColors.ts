/**
 * Chart.js Color Utilities
 * Provides computed color values for Chart.js canvas rendering
 * Uses oklch color format for perceptually uniform colors
 */

export interface ChartColorPalette {
    grid: string;
    text: string;
    textMuted: string;
    border: string;
    background: string;
    primary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}

// Light theme colors in oklch
const lightColors: ChartColorPalette = {
    grid: 'oklch(0 0 0 / 0.1)',
    text: 'oklch(0.45 0.015 260)',      // gray-700
    textMuted: 'oklch(0.55 0.014 260)', // gray-500
    border: 'oklch(0.93 0.006 260)',    // gray-200
    background: 'oklch(1 0 0)',
    primary: 'oklch(0.62 0.180 260)',   // blue-500
    success: 'oklch(0.72 0.190 145)',   // green-500
    warning: 'oklch(0.77 0.180 75)',    // amber-500
    error: 'oklch(0.63 0.200 25)',      // red-500
    info: 'oklch(0.62 0.180 260)',      // blue-500
};

// Dark theme colors in oklch
const darkColors: ChartColorPalette = {
    grid: 'oklch(1 0 0 / 0.1)',
    text: 'oklch(0.93 0.006 260)',      // gray-200
    textMuted: 'oklch(0.71 0.010 260)', // gray-400
    border: 'oklch(0.45 0.015 260)',    // gray-700
    background: 'oklch(0.30 0.020 260)', // gray-800
    primary: 'oklch(0.71 0.140 255)',   // blue-400
    success: 'oklch(0.79 0.170 145)',   // green-400
    warning: 'oklch(0.83 0.175 85)',    // amber-400
    error: 'oklch(0.70 0.150 25)',      // red-400
    info: 'oklch(0.71 0.140 255)',      // blue-400
};

export const getChartColors = (isDark: boolean): ChartColorPalette => {
    return isDark ? darkColors : lightColors;
};

// Predefined color palette for multi-series charts (oklch)
export const CHART_COLORS: readonly string[] = [
    'oklch(0.62 0.180 260)', // blue
    'oklch(0.72 0.190 145)', // green
    'oklch(0.77 0.180 75)',  // amber
    'oklch(0.63 0.200 25)',  // red
    'oklch(0.58 0.190 295)', // violet
    'oklch(0.65 0.220 350)', // pink
    'oklch(0.70 0.140 200)', // cyan
    'oklch(0.75 0.190 120)', // lime
] as const;

// Get color by index (cycles through palette)
export const getChartColor = (index: number): string => {
    return CHART_COLORS[index % CHART_COLORS.length]!;
};
