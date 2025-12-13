/**
 * MultiSelectChips Component
 * Combobox-pattern multi-select with searchable dropdown and removable chips
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface MultiSelectChipsProps {
    value: string[];
    options: string[];
    onChange: (value: string[]) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
    value,
    options,
    onChange,
    label,
    placeholder = 'Click to add...',
    error,
    disabled = false,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter options based on search term
    const filteredOptions = options.filter(
        (opt) =>
            opt.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !value.includes(opt)
    );

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleAdd = (option: string) => {
        onChange([...value, option]);
        setSearchTerm('');
        inputRef.current?.focus();
    };

    const handleRemove = (option: string) => {
        onChange(value.filter((v) => v !== option));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        } else if (e.key === 'Backspace' && searchTerm === '' && value.length > 0) {
            const lastItem = value[value.length - 1];
            if (lastItem) handleRemove(lastItem);
        } else if (e.key === 'Enter' && filteredOptions.length > 0) {
            e.preventDefault();
            const firstOption = filteredOptions[0];
            if (firstOption) handleAdd(firstOption);
        }
    };

    return (
        <div className={cn('multi-select-chips', className || '')} ref={containerRef}>
            {label && (
                <label className="multi-select-chips__label">{label}</label>
            )}

            <div
                className={cn(
                    'multi-select-chips__container',
                    isOpen && 'multi-select-chips__container--open',
                    error && 'multi-select-chips__container--error',
                    disabled && 'multi-select-chips__container--disabled'
                )}
                onClick={() => !disabled && setIsOpen(true)}
            >
                {/* Selected chips */}
                <div className="multi-select-chips__chips">
                    {value.map((item) => (
                        <span key={item} className="multi-select-chips__chip">
                            {item}
                            {!disabled && (
                                <button
                                    type="button"
                                    className="multi-select-chips__chip-remove"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(item);
                                    }}
                                    aria-label={`Remove ${item}`}
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </span>
                    ))}

                    {/* Search input */}
                    <input
                        ref={inputRef}
                        type="text"
                        className="multi-select-chips__input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setIsOpen(true)}
                        placeholder={value.length === 0 ? placeholder : ''}
                        disabled={disabled}
                    />
                </div>

                <ChevronDown
                    size={16}
                    className={cn(
                        'multi-select-chips__chevron',
                        isOpen && 'multi-select-chips__chevron--open'
                    )}
                />
            </div>

            {/* Dropdown */}
            {isOpen && !disabled && (
                <ul className="multi-select-chips__dropdown" role="listbox">
                    {filteredOptions.length === 0 ? (
                        <li className="multi-select-chips__dropdown-empty">
                            {options.length === value.length
                                ? 'All options selected'
                                : 'No matching options'}
                        </li>
                    ) : (
                        filteredOptions.map((option) => (
                            <li
                                key={option}
                                role="option"
                                aria-selected={value.includes(option)}
                                className="multi-select-chips__dropdown-item"
                                onClick={() => handleAdd(option)}
                            >
                                <span>{option}</span>
                                {value.includes(option) && <Check size={14} />}
                            </li>
                        ))
                    )}
                </ul>
            )}

            {error && (
                <p className="multi-select-chips__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default MultiSelectChips;
