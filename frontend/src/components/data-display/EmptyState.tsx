import React from 'react';

export interface EmptyStateProps {
    message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = 'No items to display' }) => (
    <div className="flex items-center justify-center py-12 text-gray-500">
        {message}
    </div>
);
