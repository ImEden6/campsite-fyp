# Map Editor Components Documentation

This document provides technical documentation for the map editor components, utilities, and architecture.

## Architecture Overview

The map editor is built using:
- **React** for UI components
- **Konva** for canvas rendering
- **Zustand** for state management
- **React DnD** for drag-and-drop functionality

### State Management

Three main Zustand stores manage the editor state:

1. **MapStore** (`stores/mapStore.ts`)
   - Manages map data and modules
   - Handles CRUD operations for modules
   - Persists map state

2. **EditorStore** (`stores/editorStore.ts`)
   - Manages editor UI state (tools, selection, clipboard)
   - Handles undo/redo history
   - Manages keyboard shortcuts state

3. **ViewportStore** (`stores/viewportStore.ts`)
   - Manages canvas viewport (zoom, pan)
   - Handles viewport transformations

## Core Components

### MapEditor (`pages/MapEditor.tsx`)

Main page component that orchestrates the entire map editing experience.

**Key Features:**
- Canvas rendering with Konva
- Module drag-and-drop from library
- Keyboard shortcut handling
- Undo/redo integration
- Save functionality
- Multi-module selection and transformation

**Props:** None (uses route params)

**State:**
- `backgroundImage`: Loaded background image
- `isDragging`: Pan tool drag state
- `isSaving`: Save operation state
- `hasUnsavedChanges`: Tracks unsaved modifications
- `canvasDimensions`: Canvas size for responsive rendering

**Key Methods:**
- `handleSave()`: Saves map and modules to backend
- `handleUndo()`: Restores previous map state
- `handleRedo()`: Restores next map state
- `handleCopy()`: Copies selected modules to clipboard
- `handlePaste()`: Pastes modules from clipboard
- `handleGroupTransform()`: Handles multi-module transformations

### TransformHandles (`components/TransformHandles.tsx`)

Renders 8 resize handles (4 corners, 4 edges) for module transformation.

**Props:**
```typescript
interface TransformHandlesProps {
  bounds: Bounds;                    // Current module bounds
  rotation: number;                  // Current rotation angle
  onResize: (newBounds) => void;     // Resize callback
  onResizeStart?: () => void;        // Resize start callback
  onResizeEnd: () => void;           // Resize end callback
  snapToGrid: boolean;               // Enable grid snapping
  gridSize: number;                  // Grid size in pixels
  minSize?: Size;                    // Minimum size constraint
  maxSize?: Size;                    // Maximum size constraint
  preserveAspectRatio?: boolean;     // Force aspect ratio preservation
}
```

**Features:**
- 8 interactive resize handles
- Corner handles: Proportional resize from opposite corner
- Edge handles: Single-axis resize
- Shift key: Maintains aspect ratio
- Snap-to-grid support
- Real-time size display during resize
- Minimum/maximum size enforcement
- Performance optimized with RAF throttling

**Handle Positions:**
- `top-left`, `top-center`, `top-right`
- `middle-left`, `middle-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### RotationHandle (`components/RotationHandle.tsx`)

Renders a rotation handle above the module for rotation transformations.

**Props:**
```typescript
interface RotationHandleProps {
  bounds: Bounds;                    // Module bounds
  currentRotation: number;           // Current rotation angle
  onRotate: (newRotation) => void;   // Rotation callback
  onRotateStart?: () => void;        // Rotation start callback
  onRotateEnd: () => void;           // Rotation end callback
  snapAngle?: number;                // Snap angle (default: 15°)
}
```

**Features:**
- Circular handle above module
- Dashed connecting line to module
- Real-time angle display (0-360°)
- Shift key: Snaps to 15-degree increments
- Rotation around module center
- Performance optimized with RAF throttling

**Rotation Calculation:**
- Uses `Math.atan2()` for angle calculation
- Normalizes angles to 0-360° range
- Applies snap-to-angle when Shift is pressed

### SelectionBoundingBox (`components/SelectionBoundingBox.tsx`)

Renders a bounding box around multiple selected modules with transform handles.

**Props:**
```typescript
interface SelectionBoundingBoxProps {
  modules: AnyModule[];              // Selected modules
  onTransform: (transform) => void;  // Transform callback
  onTransformStart?: () => void;     // Transform start callback
  onTransformEnd: () => void;        // Transform end callback
  snapToGrid: boolean;               // Enable grid snapping
  gridSize: number;                  // Grid size in pixels
}
```

**Features:**
- Dashed bounding box around all selected modules
- Group move: Drag to move all modules together
- Group resize: Scale all modules proportionally
- Group rotate: Rotate all modules around group center
- Maintains relative positions during transformations
- Integrates TransformHandles and RotationHandle

**Transform Types:**
```typescript
{
  translation?: { x: number; y: number };  // Group move
  scale?: { x: number; y: number };        // Group resize
  rotation?: number;                       // Group rotate
}
```

### RulerComponent (`components/RulerComponent.tsx`)

Displays measurement rulers along canvas edges.

**Props:**
```typescript
interface RulerProps {
  orientation: 'horizontal' | 'vertical';  // Ruler orientation
  length: number;                          // Ruler length in pixels
  zoom: number;                            // Current zoom level
  offset: number;                          // Viewport offset
}
```

**Features:**
- Horizontal and vertical rulers
- Major marks every 100px
- Minor marks every 20px
- Numeric labels at major marks
- Zoom-adaptive intervals
- SVG rendering for crisp display
- Memoized for performance

**Mark Intervals by Zoom:**
- Zoom < 0.5: Minor 100px, Major 500px
- Zoom < 1.0: Minor 50px, Major 200px
- Zoom 1.0-2.0: Minor 20px, Major 100px
- Zoom > 2.0: Minor 10px, Major 50px

### ModuleRenderer (`components/ModuleRenderer.tsx`)

Renders individual modules on the canvas with transform handles.

**Props:**
```typescript
interface ModuleRendererProps {
  module: AnyModule;                 // Module to render
  isSelected: boolean;               // Selection state
  onSelect: () => void;              // Selection callback
}
```

**Features:**
- Renders module shape, icon, and label
- Shows TransformHandles when selected
- Shows RotationHandle when selected
- Handles module drag and drop
- Applies rotation transformation
- Respects locked state

### PropertiesPanel (`components/PropertiesPanel.tsx`)

Displays and allows editing of module properties.

**Props:**
```typescript
interface PropertiesPanelProps {
  onModuleChange: () => void;        // Module change callback
  onUnsavedChanges: () => void;      // Unsaved changes callback
}
```

**Features:**
- Displays properties for selected module
- Type-specific property editors
- Real-time updates
- Validation
- History integration
- Collapsible sections

### KeyboardShortcutsDialog (`components/accessibility/KeyboardShortcutsDialog.tsx`)

Modal dialog displaying all available keyboard shortcuts.

**Props:**
```typescript
interface KeyboardShortcutsDialogProps {
  isOpen: boolean;                   // Dialog visibility
  onClose: () => void;               // Close callback
}
```

**Features:**
- Organized by category (Selection, Tools, Editing, History, View, File, Help)
- Visual key representations
- Searchable/filterable
- Accessible with ARIA labels
- Responsive design

## Utility Functions

### transformUtils.ts

Provides geometric calculation functions for transformations.

**Key Functions:**

```typescript
// Calculate new bounds when resizing from a handle
calculateResize(
  handle: ResizeHandle,
  currentBounds: Bounds,
  mousePosition: Position,
  startMousePosition: Position,
  options: ResizeOptions
): ResizeResult

// Calculate rotation angle from mouse position
calculateRotation(
  center: Position,
  mousePosition: Position,
  options: RotationOptions
): RotationResult

// Calculate bounding box for multiple modules
calculateBoundingBox(
  modules: Array<{ position, size, rotation }>
): Bounds

// Snap position to grid
snapToGrid(position: Position, gridSize: number): Position

// Snap size to grid
snapSizeToGrid(size: Size, gridSize: number): Size

// Clamp position within boundaries
clampPosition(
  position: Position,
  size: Size,
  bounds: Bounds
): Position

// Get center point of bounds
getBoundsCenter(bounds: Bounds): Position

// Rotate point around center
rotatePoint(
  point: Position,
  center: Position,
  angleDegrees: number
): Position
```

**Resize Handles:**
- Corner handles: `top-left`, `top-right`, `bottom-left`, `bottom-right`
- Edge handles: `top-center`, `bottom-center`, `middle-left`, `middle-right`

**Options:**
- `preserveAspectRatio`: Maintain aspect ratio during resize
- `snapToGrid`: Snap dimensions to grid increments
- `minSize`: Enforce minimum size constraints
- `maxSize`: Enforce maximum size constraints
- `snapAngle`: Snap rotation to angle increments

### historyManager.ts

Manages undo/redo functionality with state history.

**Key Class:**

```typescript
class HistoryManager {
  constructor(config?: { maxHistorySize?: number })
  
  // Push new state to history
  pushState(mapState: CampsiteMap, action: HistoryAction): void
  
  // Undo last action
  undo(): CampsiteMap | null
  
  // Redo last undone action
  redo(): CampsiteMap | null
  
  // Check if undo is available
  canUndo(): boolean
  
  // Check if redo is available
  canRedo(): boolean
  
  // Clear all history
  clear(): void
  
  // Get history snapshot
  getSnapshot(): HistorySnapshot
}
```

**Action Types:**
- `module_add`: Module added to map
- `module_delete`: Module removed from map
- `module_move`: Module(s) moved
- `module_resize`: Module(s) resized
- `module_rotate`: Module(s) rotated
- `module_update`: Module properties updated
- `bulk_operation`: Multiple operations

**Features:**
- Maximum 50 states in history
- Deep cloning with `structuredClone()`
- Automatic redo stack clearing on new actions
- Action metadata tracking

### keyboardHandler.ts

Manages keyboard shortcuts and event handling.

**Key Class:**

```typescript
class KeyboardHandler {
  // Register a keyboard shortcut
  register(shortcut: KeyboardShortcut): void
  
  // Unregister a shortcut
  unregister(shortcut): void
  
  // Start listening to keyboard events
  startListening(): void
  
  // Stop listening to keyboard events
  stopListening(): void
  
  // Check if a key is pressed
  isKeyPressed(key: string): boolean
  
  // Check if Ctrl/Cmd is pressed
  isCtrlPressed(): boolean
  
  // Check if Shift is pressed
  isShiftPressed(): boolean
  
  // Get all registered shortcuts
  getAllShortcuts(): KeyboardShortcut[]
}
```

**Shortcut Definition:**
```typescript
interface KeyboardShortcut {
  key: string;                       // Key to trigger
  ctrl?: boolean;                    // Require Ctrl/Cmd
  shift?: boolean;                   // Require Shift
  alt?: boolean;                     // Require Alt
  meta?: boolean;                    // Require Meta/Cmd
  handler: (event) => void;          // Handler function
  description?: string;              // Description for UI
  preventDefault?: boolean;          // Prevent default behavior
}
```

**Features:**
- Conflict detection
- Modifier key tracking
- Input field detection (prevents shortcuts while typing)
- Category-based organization
- Format shortcuts for display

### validationUtils.ts

Provides validation functions for module properties.

**Key Functions:**

```typescript
// Validate module size
validateSize(size: Size): ValidationResult

// Enforce minimum size constraints
enforceMinimumSize(size: Size, minSize?: Size): Size

// Validate rotation angle
validateRotation(angle: number): ValidationResult

// Normalize rotation to 0-360 range
normalizeRotation(angle: number): number

// Validate position within bounds
validatePosition(
  position: Position,
  size: Size,
  bounds: Bounds
): ValidationResult
```

**Validation Rules:**
- Minimum size: 20x20 pixels
- Rotation: 0-360 degrees
- Position: Within map bounds

## Performance Optimizations

### RAF Throttling

Mouse move events during transformations are throttled using `requestAnimationFrame`:

```typescript
const handleMouseMove = rafThrottle((e) => {
  // Transform logic
});
```

**Benefits:**
- Smooth 60 FPS performance
- Prevents excessive re-renders
- Reduces CPU usage

### Memoization

Components use `React.memo()` to prevent unnecessary re-renders:

```typescript
export default React.memo(TransformHandles, (prevProps, nextProps) => {
  return (
    prevProps.bounds.x === nextProps.bounds.x &&
    prevProps.bounds.y === nextProps.bounds.y &&
    // ... other comparisons
  );
});
```

### Performance Monitoring

Built-in performance monitoring tracks operation duration:

```typescript
const end = performanceMonitor.start('handle-resize');
try {
  // Resize logic
} finally {
  end();
}
```

### Konva Optimizations

- **Caching**: Static elements (background, grid) use Konva caching
- **perfectDrawEnabled**: Disabled for better performance
- **Layer separation**: Background, modules, and selection on separate layers

## Testing

### Unit Tests

Located in `utils/__tests__/`:
- `transformUtils.test.ts`: Tests for geometric calculations
- `historyManager.test.ts`: Tests for undo/redo functionality
- `keyboardHandler.test.ts`: Tests for keyboard shortcuts

### Integration Tests

Located in `tests/integration/`:
- `map-editor-transforms.test.tsx`: Tests for resize, rotate, multi-module operations
- `map-editor-e2e.test.tsx`: End-to-end workflow tests

**Test Coverage:**
- Module transformations (resize, rotate, move)
- Undo/redo operations
- Copy/paste functionality
- Keyboard shortcuts
- Edge cases and error conditions
- Performance with large datasets
- Accessibility compliance

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test map-editor-transforms

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

## Accessibility

### Keyboard Navigation

All operations are accessible via keyboard:
- Tool selection: V, H, R, S
- Module selection: Click, A (select all), Escape (deselect)
- Editing: Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+D, Delete
- History: Ctrl+Z, Ctrl+Y
- View: G, +, -

### Screen Reader Support

- ARIA labels on all interactive elements
- Announce state changes
- Describe transform operations
- Provide text alternatives for visual feedback

### Focus Management

- Logical tab order
- Visible focus indicators
- Focus restoration after operations
- Keyboard trap prevention

### Visual Feedback

- High contrast selection indicators
- Clear focus states
- Visible transform handles
- Status messages for operations

## Error Handling

### Validation

- Minimum size enforcement (20x20 pixels)
- Rotation angle normalization (0-360°)
- Position boundary clamping
- Property value validation

### Error Recovery

- Invalid state detection
- Revert to last known good state
- User-friendly error messages
- Error logging for debugging

### Edge Cases

- Empty clipboard paste
- Undo with no history
- Redo with no future states
- Locked module operations
- Invalid module IDs
- History overflow (max 50 states)

## Best Practices

### Component Development

1. **Use TypeScript**: Strict typing for all props and state
2. **Memoization**: Use `React.memo()` for expensive components
3. **Performance**: Throttle mouse events with RAF
4. **Accessibility**: Add ARIA labels and keyboard support
5. **Error Handling**: Validate inputs and handle edge cases

### State Management

1. **Immutability**: Never mutate state directly
2. **Shallow Updates**: Use shallow cloning when possible
3. **Deep Cloning**: Use `structuredClone()` for history
4. **Selective Updates**: Only update changed properties

### Testing

1. **Unit Tests**: Test utilities in isolation
2. **Integration Tests**: Test component interactions
3. **E2E Tests**: Test complete workflows
4. **Edge Cases**: Test error conditions and boundaries
5. **Performance**: Test with large datasets

### Documentation

1. **JSDoc Comments**: Document all public APIs
2. **Type Definitions**: Export all interfaces
3. **Examples**: Provide usage examples
4. **Changelog**: Document breaking changes

## Future Enhancements

### Planned Features

1. **Advanced Selection**
   - Lasso selection tool
   - Magic wand selection
   - Selection by type/property

2. **Advanced Transforms**
   - Skew transformation
   - Perspective transformation
   - Align and distribute tools

3. **Collaboration**
   - Real-time collaborative editing
   - Cursor tracking
   - Change notifications

4. **Templates**
   - Save selection as template
   - Template library
   - Template marketplace

5. **Export Options**
   - Export as image (PNG, JPG)
   - Export as PDF
   - Export as SVG
   - Export module data as JSON

## Support and Resources

- **API Documentation**: See `docs/api/maps.md`
- **User Guide**: See `docs/user-guide/map-editor.md`
- **Issue Tracker**: GitHub Issues
- **Contributing**: See `CONTRIBUTING.md`

## Version History

### v2.0.0 (Current)
- Added module resize with transform handles
- Added module rotation with rotation handle
- Added multi-module transformations
- Added undo/redo functionality (50 states)
- Added copy/paste/cut/duplicate operations
- Added rulers for measurements
- Added comprehensive keyboard shortcuts
- Added keyboard shortcuts dialog
- Performance optimizations with RAF throttling
- Accessibility improvements

### v1.0.0
- Initial map editor implementation
- Basic module placement
- Drag and drop from library
- Properties panel
- Grid and snap-to-grid
- Zoom and pan
