/**
 * Module Icons Configuration
 * Maps module types to Lucide icons and brand colors
 */

import {
    Tent,
    Bath,
    Archive,
    Building,
    Car,
    Droplets,
    Zap,
    Trash2,
    TreePine,
    Puzzle,
} from 'lucide-react';
import type { ModuleType } from '@/types';
import React from 'react';

export interface ModuleIconConfig {
    icon: React.ElementType;
    color: string;
    label: string;
}

export const MODULE_ICONS: Record<ModuleType, ModuleIconConfig> = {
    campsite: {
        icon: Tent,
        color: 'oklch(0.723 0.192 149.6)', // green-500
        label: 'Campsite',
    },
    toilet: {
        icon: Bath,
        color: 'oklch(0.623 0.188 259.8)', // blue-500
        label: 'Toilet',
    },
    storage: {
        icon: Archive,
        color: 'oklch(0.769 0.165 70.1)', // amber-500
        label: 'Storage',
    },
    building: {
        icon: Building,
        color: 'oklch(0.606 0.219 292.7)', // violet-500
        label: 'Building',
    },
    parking: {
        icon: Car,
        color: 'oklch(0.585 0.204 277.1)', // indigo-500
        label: 'Parking',
    },
    water_source: {
        icon: Droplets,
        color: 'oklch(0.715 0.126 215.2)', // cyan-500
        label: 'Water Source',
    },
    electricity: {
        icon: Zap,
        color: 'oklch(0.795 0.162 86)', // yellow-500
        label: 'Electricity',
    },
    waste_disposal: {
        icon: Trash2,
        color: 'oklch(0.768 0.204 130.8)', // lime-500
        label: 'Waste Disposal',
    },
    recreation: {
        icon: TreePine,
        color: 'oklch(0.704 0.123 182.5)', // teal-500
        label: 'Recreation',
    },
    custom: {
        icon: Puzzle,
        color: 'oklch(0.656 0.212 354.3)', // pink-500
        label: 'Custom',
    },
};

export function getModuleIcon(type: ModuleType): ModuleIconConfig {
    return MODULE_ICONS[type] || MODULE_ICONS.custom;
}
