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
    Route,
    Droplets,
    Zap,
    Trash2,
    TreePine,
    Puzzle,
    type LucideIcon,
} from 'lucide-react';
import type { ModuleType } from '@/types';

export interface ModuleIconConfig {
    icon: LucideIcon;
    color: string;
    label: string;
}

export const MODULE_ICONS: Record<ModuleType, ModuleIconConfig> = {
    campsite: {
        icon: Tent,
        color: '#22c55e', // green-500
        label: 'Campsite',
    },
    toilet: {
        icon: Bath,
        color: '#3b82f6', // blue-500
        label: 'Toilet',
    },
    storage: {
        icon: Archive,
        color: '#f59e0b', // amber-500
        label: 'Storage',
    },
    building: {
        icon: Building,
        color: '#8b5cf6', // violet-500
        label: 'Building',
    },
    parking: {
        icon: Car,
        color: '#6366f1', // indigo-500
        label: 'Parking',
    },
    road: {
        icon: Route,
        color: '#64748b', // slate-500
        label: 'Road',
    },
    water_source: {
        icon: Droplets,
        color: '#06b6d4', // cyan-500
        label: 'Water Source',
    },
    electricity: {
        icon: Zap,
        color: '#eab308', // yellow-500
        label: 'Electricity',
    },
    waste_disposal: {
        icon: Trash2,
        color: '#84cc16', // lime-500
        label: 'Waste Disposal',
    },
    recreation: {
        icon: TreePine,
        color: '#14b8a6', // teal-500
        label: 'Recreation',
    },
    custom: {
        icon: Puzzle,
        color: '#ec4899', // pink-500
        label: 'Custom',
    },
};

export function getModuleIcon(type: ModuleType): ModuleIconConfig {
    return MODULE_ICONS[type] || MODULE_ICONS.custom;
}
