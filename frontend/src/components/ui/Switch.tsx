import React from 'react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    description?: string;
    className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    disabled = false,
    label,
    description,
    className = '',
}) => {
    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <div className={`flex items-start ${className}`}>
            <div className="flex items-center h-6">
                <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-disabled={disabled}
                    onClick={handleToggle}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            ${checked ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <span className="sr-only">{label || 'Toggle'}</span>
                    <span
                        aria-hidden="true"
                        className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
                    />
                </button>
            </div>
            {(label || description) && (
                <div className="ml-3 text-sm">
                    {label && (
                        <label
                            onClick={handleToggle}
                            className={`font-medium text-gray-900 dark:text-gray-100 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                }`}
                        >
                            {label}
                        </label>
                    )}
                    {description && (
                        <p className="text-gray-500 dark:text-gray-400">{description}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Switch;
