/**
 * FeatureCard Component
 * Icon + title + description pattern for features/benefits sections
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface FeatureCardProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    color?: 'green' | 'brown' | 'gold' | 'blue';
    className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
    icon: Icon,
    title,
    description,
    color = 'green',
    className,
}) => {
    const colorStyles = {
        green: {
            bg: 'bg-primary-50 dark:bg-primary-950/50',
            icon: 'text-primary-600 dark:text-primary-400',
            ring: 'ring-primary-100 dark:ring-primary-900/50',
        },
        brown: {
            bg: 'bg-secondary-50 dark:bg-secondary-950/50',
            icon: 'text-secondary-600 dark:text-secondary-400',
            ring: 'ring-secondary-100 dark:ring-secondary-900/50',
        },
        gold: {
            bg: 'bg-accent-50 dark:bg-accent-950/50',
            icon: 'text-accent-600 dark:text-accent-400',
            ring: 'ring-accent-100 dark:ring-accent-900/50',
        },
        blue: {
            bg: 'bg-info-50 dark:bg-info-950/50',
            icon: 'text-info-600 dark:text-info-400',
            ring: 'ring-info-100 dark:ring-info-900/50',
        },
    };

    const styles = colorStyles[color];

    return (
        <div
            className={cn(
                'group p-6 rounded-2xl bg-white dark:bg-night-surface border border-secondary-100 dark:border-secondary-800',
                'shadow-campsite transition-all duration-300',
                'hover:shadow-organic hover:-translate-y-1',
                className
            )}
        >
            {/* Icon Container */}
            <div
                className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                    'ring-4',
                    styles.bg,
                    styles.ring,
                    'transition-transform duration-300 group-hover:scale-110'
                )}
            >
                <Icon className={cn('w-6 h-6', styles.icon)} />
            </div>

            {/* Title */}
            <h3 className="font-heading text-lg font-semibold text-gray-900 dark:text-primary-100 mb-2">
                {title}
            </h3>

            {/* Description */}
            <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">
                {description}
            </p>
        </div>
    );
};

FeatureCard.displayName = 'FeatureCard';

export default FeatureCard;
