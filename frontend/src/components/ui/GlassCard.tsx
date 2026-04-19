/**
 * GlassCard Component
 * A glassmorphism card with backdrop blur for hero sections and overlays
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    intensity?: 'light' | 'medium' | 'strong';
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    className,
    intensity = 'medium',
    ...props
}) => {
    const intensityStyles = {
        light: 'bg-white/50 dark:bg-night-surface/40 backdrop-blur-sm',
        medium: 'bg-white/80 dark:bg-night-surface/70 backdrop-blur-md',
        strong: 'bg-white/95 dark:bg-night-surface/90 backdrop-blur-lg',
    };

    return (
        <div
            className={cn(
                'rounded-2xl border border-white/20 dark:border-white/10 shadow-organic',
                intensityStyles[intensity],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

GlassCard.displayName = 'GlassCard';

export default GlassCard;
