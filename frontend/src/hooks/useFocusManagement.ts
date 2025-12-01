import { useEffect, useRef, useCallback } from 'react';

interface UseFocusManagementOptions {
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

/**
 * Hook for managing focus in components
 * Handles focus restoration and auto-focus behavior
 */
export const useFocusManagement = (
  isActive: boolean,
  options: UseFocusManagementOptions = {}
) => {
  const { restoreFocus = true, autoFocus = true } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Auto-focus the first focusable element in the container
      if (autoFocus && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0 && focusableElements[0]) {
          focusableElements[0].focus();
        }
      }
    }

    return () => {
      // Restore focus to the previously focused element
      if (restoreFocus && previousActiveElement.current && !isActive) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus]);

  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return { setContainerRef };
};

/**
 * Hook for trapping focus within a container
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement && lastElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement && firstElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  const setContainerRef = useCallback((element: HTMLElement | null) => {
    containerRef.current = element;
  }, []);

  return { setContainerRef };
};

/**
 * Hook for announcing messages to screen readers
 */
export const useAnnounce = () => {
  const announceRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create a live region if it doesn't exist
    if (!announceRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
      announceRef.current = liveRegion;
    }

    return () => {
      if (announceRef.current && document.body.contains(announceRef.current)) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', politeness);
      announceRef.current.textContent = message;

      // Clear the message after a short delay to allow re-announcement of the same message
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  return { announce };
};
