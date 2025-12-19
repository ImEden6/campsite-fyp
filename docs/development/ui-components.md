# UI Component System

The frontend uses a custom UI component library built with React, TypeScript, and Tailwind CSS. All components are fully typed and follow consistent design patterns.

## Component Library Location

All reusable UI components are located in `frontend/src/components/ui/` and exported through a barrel file (`index.ts`) for clean imports.

## Available Components

### Button

A versatile button component with multiple variants, sizes, and loading states.

**Import:**
```typescript
import { Button } from '@components/ui';
import type { ButtonProps } from '@components/ui';
```

**Props:**
- `variant`: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `loading`: `boolean` (default: `false`) - Shows spinner and disables button
- `disabled`: `boolean` - Disables the button
- `children`: `React.ReactNode` - Button content
- All standard HTML button attributes

**Variants:**
- **primary**: Blue background, white text - for primary actions
- **secondary**: Gray background, white text - for secondary actions
- **outline**: Transparent with border - for tertiary actions
- **ghost**: Transparent, hover effect - for minimal actions
- **danger**: Red background, white text - for destructive actions

**Sizes:**
- **sm**: Height 32px (8), padding 12px (3), text-sm
- **md**: Height 40px (10), padding 16px (4), text-base
- **lg**: Height 48px (12), padding 24px (6), text-lg

**Usage Examples:**
```typescript
// Primary button
<Button onClick={handleSubmit}>Submit</Button>

// Loading state
<Button loading={isSubmitting}>Save Changes</Button>

// Danger variant
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>

// Small outline button
<Button variant="outline" size="sm">
  Cancel
</Button>

// Disabled button
<Button disabled>Unavailable</Button>
```

**Accessibility:**
- Proper focus ring with `focus-visible:ring-2`
- Disabled state prevents interaction and reduces opacity
- Loading state shows visual feedback with animated spinner
- Supports keyboard navigation

### Input

Text input component with validation states and icons.

**Import:**
```typescript
import { Input } from '@components/ui';
import type { InputProps } from '@components/ui';
```

### Select

Dropdown select component with custom styling.

**Import:**
```typescript
import { Select } from '@components/ui';
import type { SelectProps, SelectOption } from '@components/ui';
```

### Modal

Modal dialog component for overlays and confirmations.

**Import:**
```typescript
import { Modal } from '@components/ui';
import type { ModalProps } from '@components/ui';
```

### Card

Card container components for content grouping.

**Import:**
```typescript
import { Card, CardHeader, CardTitle, CardBody, CardFooter } from '@components/ui';
import type { CardProps } from '@components/ui';
```

### Badge

Badge component for status indicators and labels.

**Import:**
```typescript
import { Badge } from '@components/ui';
import type { BadgeProps } from '@components/ui';
```

### Alert

Alert component for notifications and messages.

**Import:**
```typescript
import { Alert } from '@components/ui';
```

## Design System

### Theme System

The application supports light and dark themes managed by the `uiStore`:

**Theme Switching:**
```typescript
import { useUIStore } from '@/stores/uiStore';

// In your component
const { theme, setTheme, toggleTheme } = useUIStore();

// Set specific theme
setTheme('dark');

// Toggle between themes
toggleTheme();
```

**Features:**
- Smooth transitions using the View Transition API (Chrome 111+, Edge 111+)
- Automatic fallback for browsers without View Transition API support
- Theme preference persisted in localStorage
- Tailwind dark mode classes automatically applied to `document.documentElement`
- System dark mode preference detection and automatic application
- Zero flash of unstyled content (FOUC) on page load

**Implementation Details:**
- Theme state managed by Zustand store with persistence
- Uses Tailwind's `dark:` variant for styling
- View Transition API provides smooth cross-fade between themes
- Theme initialized synchronously on module load before React renders
- Multi-source theme loading with fallback chain:
  1. Zustand persist storage (`ui-storage` in localStorage)
  2. Direct theme storage (`theme` key in localStorage)
  3. System preference via `prefers-color-scheme` media query
- Robust error handling for corrupted localStorage data
- Theme applied immediately to prevent visual flash

**System Preference Detection:**
The system automatically detects and applies your operating system's dark mode preference if no theme has been previously set:
```typescript
// Automatically applied on first visit
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

**Storage Priority:**
1. **Zustand Persist**: Primary storage location (`ui-storage`)
2. **Direct Storage**: Fallback for legacy or direct theme changes (`theme`)
3. **System Preference**: Used only when no stored preference exists

### Colors

The component system uses Tailwind CSS color palette with dark mode support:
- **Primary**: Blue (600, 700) / Dark mode variants
- **Secondary**: Gray (600, 700) / Dark mode variants
- **Danger**: Red (600, 700) / Dark mode variants
- **Success**: Green (600, 700) / Dark mode variants
- **Warning**: Yellow (600, 700) / Dark mode variants

### Typography

- **Small**: text-sm (14px)
- **Base**: text-base (16px)
- **Large**: text-lg (18px)

### Spacing

Components use Tailwind's spacing scale (4px base unit):
- **sm**: 8px (2)
- **md**: 16px (4)
- **lg**: 24px (6)

### Border Radius

- Default: `rounded-md` (6px)
- Cards: `rounded-lg` (8px)

## Creating New Components

When creating new UI components:

1. **Location**: Place in `frontend/src/components/ui/`
2. **TypeScript**: Use strict typing with exported interfaces
3. **Styling**: Use Tailwind CSS utility classes
4. **Accessibility**: Include proper ARIA attributes and keyboard support
5. **Forwarding Refs**: Use `React.forwardRef` for components that need ref access
6. **Export**: Add to `frontend/src/components/ui/index.ts`

**Example Template:**
```typescript
import React from 'react';
import { cn } from '@/utils/cn';

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'special';
  children: React.ReactNode;
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseStyles = 'base-classes';
    const variants = {
      default: 'default-classes',
      special: 'special-classes',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MyComponent.displayName = 'MyComponent';

export default MyComponent;
```

## Utility Functions

### cn (classnames)

The `cn` utility function from `@/utils/cn` is used to merge Tailwind classes safely:

```typescript
import { cn } from '@/utils/cn';

// Merge classes with conditional logic
const className = cn(
  'base-class',
  isActive && 'active-class',
  isPrimary ? 'primary-class' : 'secondary-class',
  customClassName
);
```

## Best Practices

1. **Composition over Configuration**: Prefer composing small components over large configurable ones
2. **Type Safety**: Always export TypeScript interfaces for component props
3. **Accessibility First**: Include ARIA attributes, keyboard navigation, and focus management
4. **Consistent Naming**: Use PascalCase for components, camelCase for props
5. **Tailwind Classes**: Use utility classes instead of custom CSS when possible
6. **Responsive Design**: Include responsive variants for mobile, tablet, and desktop
7. **Loading States**: Provide visual feedback for async operations
8. **Error States**: Handle and display error states appropriately

## Testing Components

UI components should be tested for:
- Rendering with different prop combinations
- User interactions (clicks, keyboard events)
- Accessibility (ARIA attributes, keyboard navigation)
- Responsive behavior

See [Testing Guidelines](./testing.md) for more details.

## Related Documentation

- [Frontend Configuration](../../frontend/CONFIG.md)
- [Development Setup](./setup.md)
- [Coding Standards](./coding-standards.md)
