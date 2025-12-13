/**
 * FieldWithTooltip Component
 * Wrapper that adds an info icon with hover tooltip for field descriptions
 */

import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { cn } from '@/utils/cn';

export interface FieldWithTooltipProps {
    label: string;
    tooltip: string;
    children: React.ReactNode;
    className?: string;
}

export const FieldWithTooltip: React.FC<FieldWithTooltipProps> = ({
    label,
    tooltip,
    children,
    className,
}) => {
    return (
        <div className={cn('field-with-tooltip', className)}>
            <div className="field-with-tooltip__label-row">
                <label className="field-with-tooltip__label">{label}</label>
                <Tooltip content={tooltip} placement="top">
                    <button
                        type="button"
                        className="field-with-tooltip__info"
                        aria-label={`Info: ${tooltip}`}
                    >
                        <Info size={14} />
                    </button>
                </Tooltip>
            </div>
            {children}
        </div>
    );
};

export default FieldWithTooltip;
