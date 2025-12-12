import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<Record<string, unknown>>;
  delay?: number;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 100,
  placement = 'top',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isHoveringRef = useRef(false);

  const showTooltip = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled) return;

    isHoveringRef.current = true;
    triggerRef.current = e.currentTarget;
    const rect = e.currentTarget.getBoundingClientRect();

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom;
        break;
      case 'left':
        x = rect.left;
        y = rect.top + rect.height / 2;
        break;
      case 'right':
        x = rect.right;
        y = rect.top + rect.height / 2;
        break;
    }

    setPosition({ x, y });

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      // Only show if still hovering
      if (isHoveringRef.current) {
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    isHoveringRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let adjustedX = position.x;
      let adjustedY = position.y;

      // Adjust for viewport boundaries
      if (placement === 'top' || placement === 'bottom') {
        adjustedX -= tooltipRect.width / 2;
        if (adjustedX < 8) adjustedX = 8;
        if (adjustedX + tooltipRect.width > window.innerWidth - 8) {
          adjustedX = window.innerWidth - tooltipRect.width - 8;
        }

        if (placement === 'top') {
          adjustedY -= tooltipRect.height + 8;
        } else {
          adjustedY += 8;
        }
      } else {
        adjustedY -= tooltipRect.height / 2;
        if (adjustedY < 8) adjustedY = 8;
        if (adjustedY + tooltipRect.height > window.innerHeight - 8) {
          adjustedY = window.innerHeight - tooltipRect.height - 8;
        }

        if (placement === 'left') {
          adjustedX -= tooltipRect.width + 8;
        } else {
          adjustedX += 8;
        }
      }

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [isVisible, placement, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipContent = isVisible && content && (
    <div
      ref={tooltipRef}
      className="fixed z-[110] px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: placement === 'top' || placement === 'bottom'
          ? 'translateX(-50%)'
          : 'translateY(-50%)',
      }}
    >
      {content}
      <div
        className={`absolute ${placement === 'top'
          ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-800'
          : placement === 'bottom'
            ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-800'
            : placement === 'left'
              ? 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900 dark:border-l-gray-800'
              : 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-800'
          }`}
      />
    </div>
  );

  // Extract existing event handlers from children props
  const existingProps = children.props as {
    onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
  };

  // Create new props that merge with existing props
  const newProps: Partial<Record<string, unknown>> = {
    ...children.props,
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      existingProps.onMouseEnter?.(e);
      showTooltip(e);
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      existingProps.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      existingProps.onFocus?.(e);
      showTooltip(e as unknown as React.MouseEvent<HTMLElement>);
    },
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      existingProps.onBlur?.(e);
      hideTooltip();
    },
  };

  return (
    <>
      {React.cloneElement(children, newProps)}
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
};

export default Tooltip;

