/**
 * NumberStepper Component
 * Number input with increment/decrement buttons and min/max constraints
 */

import React, { useState, useCallback } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface NumberStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    error?: string;
    disabled?: boolean;
    showValidIcon?: boolean;
    className?: string;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({
    value,
    onChange,
    min = 0,
    max = Infinity,
    step = 1,
    label,
    error,
    disabled = false,
    showValidIcon = false,
    className,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [inputValue, setInputValue] = useState(String(value));

    // Clamp value to min/max
    const clamp = useCallback(
        (val: number) => Math.min(Math.max(val, min), max),
        [min, max]
    );

    const handleIncrement = () => {
        const newValue = clamp(value + step);
        onChange(newValue);
        setInputValue(String(newValue));
    };

    const handleDecrement = () => {
        const newValue = clamp(value - step);
        onChange(newValue);
        setInputValue(String(newValue));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleBlur = () => {
        setIsFocused(false);
        const parsed = parseFloat(inputValue);
        if (!isNaN(parsed)) {
            const clamped = clamp(parsed);
            onChange(clamped);
            setInputValue(String(clamped));
        } else {
            setInputValue(String(value));
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleIncrement();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleDecrement();
        }
    };

    const isValid = !error && value >= min && value <= max;

    return (
        <div className={cn('number-stepper', className)}>
            {label && (
                <label className="number-stepper__label">{label}</label>
            )}

            <div
                className={cn(
                    'number-stepper__container',
                    isFocused && 'number-stepper__container--focused',
                    error && 'number-stepper__container--error',
                    disabled && 'number-stepper__container--disabled'
                )}
            >
                <button
                    type="button"
                    className="number-stepper__button"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                    aria-label="Decrease"
                >
                    <Minus size={14} />
                </button>

                <input
                    type="text"
                    inputMode="numeric"
                    className="number-stepper__input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-label={label}
                />

                <button
                    type="button"
                    className="number-stepper__button"
                    onClick={handleIncrement}
                    disabled={disabled || value >= max}
                    aria-label="Increase"
                >
                    <Plus size={14} />
                </button>

                {showValidIcon && isValid && !isFocused && (
                    <Check size={14} className="number-stepper__valid-icon" />
                )}
            </div>

            {error && (
                <p className="number-stepper__error" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default NumberStepper;
