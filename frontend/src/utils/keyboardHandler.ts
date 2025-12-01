/**
 * Keyboard Handler
 * Manages keyboard shortcuts and event handling for the map editor
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
}

export interface KeyCombination {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

/**
 * KeyboardHandler class for managing keyboard shortcuts
 */
export class KeyboardHandler {
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private pressedKeys: Set<string> = new Set();
  private isEnabled: boolean = true;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
  }

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.getShortcutKey(shortcut);

    // Check for conflicts
    if (this.shortcuts.has(key)) {
      console.warn(`Keyboard shortcut conflict detected for: ${key}`);
    }

    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  unregister(shortcut: Omit<KeyboardShortcut, 'handler' | 'description' | 'preventDefault'>): void {
    const key = this.getShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Register multiple shortcuts at once
   */
  registerMultiple(shortcuts: KeyboardShortcut[]): void {
    shortcuts.forEach((shortcut) => this.register(shortcut));
  }

  /**
   * Clear all registered shortcuts
   */
  clearAll(): void {
    this.shortcuts.clear();
  }

  /**
   * Enable keyboard handler
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable keyboard handler
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Check if handler is enabled
   */
  isHandlerEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Start listening to keyboard events
   */
  startListening(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Stop listening to keyboard events
   */
  stopListening(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.pressedKeys.clear();
  }

  /**
   * Get currently pressed keys
   */
  getPressedKeys(): Set<string> {
    return new Set(this.pressedKeys);
  }

  /**
   * Check if a specific key is pressed
   */
  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key.toLowerCase());
  }

  /**
   * Check if Ctrl/Cmd is pressed
   */
  isCtrlPressed(): boolean {
    return this.pressedKeys.has('control') || this.pressedKeys.has('meta');
  }

  /**
   * Check if Shift is pressed
   */
  isShiftPressed(): boolean {
    return this.pressedKeys.has('shift');
  }

  /**
   * Check if Alt is pressed
   */
  isAltPressed(): boolean {
    return this.pressedKeys.has('alt');
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return;

    // Track pressed keys
    this.pressedKeys.add(event.key.toLowerCase());

    // Don't handle shortcuts if user is typing in an input
    if (this.isTypingInInput(event)) {
      return;
    }

    // Find matching shortcut
    const combination: KeyCombination = {
      key: event.key.toLowerCase(),
      ctrl: event.ctrlKey || event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey,
    };

    const shortcutKey = this.getCombinationKey(combination);
    const shortcut = this.shortcuts.get(shortcutKey);

    if (shortcut) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler(event);
    }
  }

  /**
   * Handle keyup event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    this.pressedKeys.delete(event.key.toLowerCase());
  }

  /**
   * Check if user is typing in an input element
   */
  private isTypingInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    
    // Handle null or undefined target
    if (!target || !target.tagName) {
      return false;
    }
    
    const tagName = target.tagName.toLowerCase();
    const isContentEditable = target.isContentEditable;

    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      isContentEditable
    );
  }

  /**
   * Generate a unique key for a shortcut
   */
  private getShortcutKey(shortcut: Omit<KeyboardShortcut, 'handler' | 'description' | 'preventDefault'>): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('ctrl');
    if (shortcut.shift) parts.push('shift');
    if (shortcut.alt) parts.push('alt');
    if (shortcut.meta) parts.push('meta');

    parts.push(shortcut.key.toLowerCase());

    return parts.join('+');
  }

  /**
   * Generate a key from a key combination
   */
  private getCombinationKey(combination: KeyCombination): string {
    const parts: string[] = [];

    if (combination.ctrl) parts.push('ctrl');
    if (combination.shift) parts.push('shift');
    if (combination.alt) parts.push('alt');
    // Don't add meta separately since it's already included in ctrl
    // if (combination.meta) parts.push('meta');

    parts.push(combination.key);

    return parts.join('+');
  }

  /**
   * Get all registered shortcuts
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * Get shortcuts grouped by category (for display purposes)
   */
  getShortcutsByCategory(): Map<string, KeyboardShortcut[]> {
    const categories = new Map<string, KeyboardShortcut[]>();

    this.shortcuts.forEach((shortcut) => {
      // Extract category from description or use default
      const category = this.extractCategory(shortcut);
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category)!.push(shortcut);
    });

    return categories;
  }

  /**
   * Extract category from shortcut description
   */
  private extractCategory(shortcut: KeyboardShortcut): string {
    // Simple categorization based on key patterns
    if (shortcut.ctrl && ['c', 'v', 'x', 'd'].includes(shortcut.key)) {
      return 'Editing';
    }
    if (shortcut.ctrl && ['z', 'y'].includes(shortcut.key)) {
      return 'History';
    }
    if (shortcut.ctrl && shortcut.key === 's') {
      return 'File';
    }
    if (['v', 'a', 'escape'].includes(shortcut.key) && !shortcut.ctrl) {
      return 'Selection';
    }
    if (['h', 'r', 's'].includes(shortcut.key) && !shortcut.ctrl) {
      return 'Tools';
    }
    if (['g', '+', '-'].includes(shortcut.key) && !shortcut.ctrl) {
      return 'View';
    }
    if (['?', 'f1'].includes(shortcut.key)) {
      return 'Help';
    }

    return 'Other';
  }

  /**
   * Format shortcut for display
   */
  static formatShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = [];

    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');

    // Capitalize key for display
    const key = shortcut.key.length === 1 
      ? shortcut.key.toUpperCase() 
      : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);
    
    parts.push(key);

    return parts.join('+');
  }
}

/**
 * Create a new KeyboardHandler instance
 */
export function createKeyboardHandler(): KeyboardHandler {
  return new KeyboardHandler();
}

/**
 * Parse a shortcut string (e.g., "Ctrl+C") into a KeyboardShortcut object
 */
export function parseShortcutString(
  shortcutString: string,
  handler: (event: KeyboardEvent) => void,
  description?: string
): KeyboardShortcut {
  const parts = shortcutString.toLowerCase().split('+');
  
  const lastPart = parts[parts.length - 1];
  const shortcut: KeyboardShortcut = {
    key: lastPart || '',
    handler,
    description,
  };

  if (parts.includes('ctrl') || parts.includes('control')) {
    shortcut.ctrl = true;
  }
  if (parts.includes('shift')) {
    shortcut.shift = true;
  }
  if (parts.includes('alt')) {
    shortcut.alt = true;
  }
  if (parts.includes('meta') || parts.includes('cmd')) {
    shortcut.meta = true;
  }

  return shortcut;
}
