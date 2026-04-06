/**
 * HelpSidebarCard
 * Shared "Need Help/Assistance" sidebar card for booking detail pages.
 */

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';

export interface HelpSidebarCardProps {
    title: string;
    description: string;
    buttonText?: string;
    onButtonClick: () => void;
}

export const HelpSidebarCard: React.FC<HelpSidebarCardProps> = ({
    title,
    description,
    buttonText = 'Contact Support',
    onButtonClick,
}) => (
    <GlassCard className="p-6 bg-primary-600/5 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800">
        <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            {title}
        </h3>
        <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-4">
            {description}
        </p>
        <Button variant="outline" className="w-full bg-white dark:bg-transparent" onClick={onButtonClick}>
            {buttonText}
        </Button>
    </GlassCard>
);
