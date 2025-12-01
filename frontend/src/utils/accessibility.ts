/**
 * Accessibility utility functions
 */

/**
 * Get all focusable elements within a container
 */
export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(selector));
};

/**
 * Check if an element is focusable
 */
export const isFocusable = (element: HTMLElement): boolean => {
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('tabindex') === '-1') return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['a', 'button', 'input', 'select', 'textarea'];

  if (focusableTags.includes(tagName)) {
    return true;
  }

  const tabindex = element.getAttribute('tabindex');
  return tabindex !== null && tabindex !== '-1';
};

/**
 * Move focus to the next focusable element
 */
export const focusNext = (container: HTMLElement = document.body): void => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

  if (currentIndex === -1 || currentIndex === focusableElements.length - 1) {
    focusableElements[0]?.focus();
  } else {
    focusableElements[currentIndex + 1]?.focus();
  }
};

/**
 * Move focus to the previous focusable element
 */
export const focusPrevious = (container: HTMLElement = document.body): void => {
  const focusableElements = getFocusableElements(container);
  const currentIndex = focusableElements.findIndex(el => el === document.activeElement);

  if (currentIndex === -1 || currentIndex === 0) {
    focusableElements[focusableElements.length - 1]?.focus();
  } else {
    focusableElements[currentIndex - 1]?.focus();
  }
};

/**
 * Trap focus within a container
 */
export const trapFocus = (container: HTMLElement, event: KeyboardEvent): void => {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey) {
    // Shift + Tab
    if (document.activeElement === firstElement && lastElement) {
      event.preventDefault();
      lastElement.focus();
    }
  } else {
    // Tab
    if (document.activeElement === lastElement && firstElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
};

/**
 * Generate a unique ID for accessibility attributes
 */
export const generateA11yId = (prefix: string = 'a11y'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce a message to screen readers
 */
export const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite'): void => {
  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'status');
  liveRegion.setAttribute('aria-live', politeness);
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.className = 'sr-only';
  liveRegion.textContent = message;

  document.body.appendChild(liveRegion);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(liveRegion);
  }, 1000);
};

/**
 * Check if the user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get the appropriate ARIA role for an element
 */
export const getAriaRole = (element: HTMLElement): string | null => {
  return element.getAttribute('role');
};

/**
 * Check if an element is visible to screen readers
 */
export const isVisibleToScreenReaders = (element: HTMLElement): boolean => {
  if (element.getAttribute('aria-hidden') === 'true') return false;
  if (element.style.display === 'none') return false;
  if (element.style.visibility === 'hidden') return false;
  if (element.hasAttribute('hidden')) return false;

  return true;
};

/**
 * Create a focus trap handler
 */
export const createFocusTrap = (container: HTMLElement) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    trapFocus(container, event);
  };

  const activate = () => {
    container.addEventListener('keydown', handleKeyDown);
  };

  const deactivate = () => {
    container.removeEventListener('keydown', handleKeyDown);
  };

  return { activate, deactivate };
};

/**
 * Restore focus to a previously focused element
 */
export const restoreFocus = (element: HTMLElement | null): void => {
  if (element && document.body.contains(element)) {
    element.focus();
  }
};

/**
 * Check if keyboard navigation is being used
 */
export const isUsingKeyboard = (): boolean => {
  return document.body.classList.contains('using-keyboard');
};

/**
 * Enable keyboard navigation mode
 */
export const enableKeyboardMode = (): void => {
  document.body.classList.add('using-keyboard');
};

/**
 * Disable keyboard navigation mode
 */
export const disableKeyboardMode = (): void => {
  document.body.classList.remove('using-keyboard');
};

/**
 * Initialize keyboard/mouse detection
 */
export const initializeInputDetection = (): void => {
  // Detect keyboard usage
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      enableKeyboardMode();
    }
  });

  // Detect mouse usage
  document.addEventListener('mousedown', () => {
    disableKeyboardMode();
  });
};
