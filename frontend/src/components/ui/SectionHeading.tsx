/**
 * SectionHeading Component
 * Consistent section headings with title + subtitle pattern
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface SectionHeadingProps {
    title: string;
    subtitle?: string;
    centered?: boolean;
    className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
    title,
    subtitle,
    centered = true,
    className,
}) => {
    return (
        <div className={cn(centered && 'text-center', className)}>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="mt-3 text-lg text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

SectionHeading.displayName = 'SectionHeading';

export default SectionHeading;
