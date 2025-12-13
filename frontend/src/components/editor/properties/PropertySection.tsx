/**
 * PropertySection Component
 * Collapsible section with icon header for grouping related properties
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react';

export interface PropertySectionProps {
    title: string;
    icon?: LucideIcon;
    defaultExpanded?: boolean;
    children: React.ReactNode;
}

export const PropertySection: React.FC<PropertySectionProps> = ({
    title,
    icon: Icon,
    defaultExpanded = true,
    children,
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="properties-panel__section-wrapper">
            <button
                type="button"
                className="properties-panel__section-header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span className="properties-panel__section-header-content">
                    {Icon && <Icon size={14} />}
                    <span>{title}</span>
                </span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
                <div className="properties-panel__section">
                    {children}
                </div>
            )}
        </div>
    );
};

export default PropertySection;
