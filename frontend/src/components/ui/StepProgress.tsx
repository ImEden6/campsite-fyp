import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Step {
  id: string;
  label: string;
  description?: string;
}

interface StepProgressProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  className,
  orientation = 'horizontal',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex gap-4">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted && 'bg-blue-600 border-blue-600 text-white',
                    isCurrent && 'border-blue-600 text-blue-600 bg-blue-50',
                    isUpcoming && 'border-gray-300 text-gray-400 bg-white'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 h-12 mt-2',
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-8">
                <h3
                  className={cn(
                    'text-sm font-semibold',
                    isCurrent && 'text-blue-600',
                    isCompleted && 'text-gray-900',
                    isUpcoming && 'text-gray-400'
                  )}
                >
                  {step.label}
                </h3>
                {step.description && (
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal orientation
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center flex-1">
                {/* Step indicator */}
                <div
                  className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted && 'bg-blue-600 border-blue-600 text-white',
                    isCurrent && 'border-blue-600 text-blue-600 bg-blue-50',
                    isUpcoming && 'border-gray-300 text-gray-400 bg-white'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent && 'text-blue-600',
                      isCompleted && 'text-gray-900',
                      isUpcoming && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 mt-[-2rem]',
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
