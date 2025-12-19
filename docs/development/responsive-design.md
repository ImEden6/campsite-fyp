# Responsive Design Guide

## Overview

The Campsite Management System frontend is built with a mobile-first approach, ensuring optimal user experience across all device sizes from mobile phones (320px) to large desktop screens (1920px+). This guide covers the responsive design patterns, components, and utilities available in the application.

## Table of Contents

- [Responsive Breakpoints](#responsive-breakpoints)
- [Responsive Hooks](#responsive-hooks)
- [Responsive Components](#responsive-components)
- [Utility Classes](#utility-classes)
- [Image Optimization](#image-optimization)
- [Best Practices](#best-practices)
- [Testing Guidelines](#testing-guidelines)

## Responsive Breakpoints

The application uses the following breakpoints configured in `tailwind.config.js`:

| Breakpoint | Width | Device Type | Usage |
|------------|-------|-------------|-------|
| `xs` | 475px | Small mobile | Extra small phones |
| `sm` | 640px | Mobile landscape | Phones in landscape mode |
| `md` | 768px | Tablet | Tablets and large phones |
| `lg` | 1024px | Desktop | Desktop and laptop screens |
| `xl` | 1280px | Large desktop | Large desktop screens |
| `2xl` | 1536px | Extra large | Extra large screens |
| `3xl` | 1920px | Ultra wide | Ultra-wide monitors |

### Usage in Tailwind

```tsx
// Hide on mobile, show on desktop
<div className="hidden lg:block">Desktop content</div>

// Show on mobile, hide on desktop
<div className="block lg:hidden">Mobile content</div>

// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">Content</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

## Responsive Hooks

Custom React hooks for detecting device types and screen sizes.

### Available Hooks

```typescript
import {
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsSmallScreen,
  useIsMediumScreen,
  useIsLargeScreen,
  useIsTouchDevice,
} from '@/hooks';
```

### Hook Definitions

| Hook | Breakpoint | Description |
|------|------------|-------------|
| `useIsMobile()` | < 768px | Mobile devices |
| `useIsTablet()` | 768px - 1023px | Tablet devices |
| `useIsDesktop()` | >= 1024px | Desktop screens |
| `useIsSmallScreen()` | < 640px | Small screens |
| `useIsMediumScreen()` | 640px - 1023px | Medium screens |
| `useIsLargeScreen()` | >= 1024px | Large screens |
| `useIsTouchDevice()` | N/A | Touch capability detection |

### Example Usage

```typescript
import { useIsMobile, useIsDesktop } from '@/hooks';

function MyComponent() {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  
  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  );
}
```

### When to Use Hooks vs CSS

**Use Hooks When:**
- Rendering completely different components
- Complex conditional logic based on screen size
- Need to trigger side effects based on screen size
- Performance optimization (avoid rendering unused components)

**Use CSS Classes When:**
- Simple visibility toggles
- Layout adjustments
- Spacing and sizing changes
- Simpler and more performant for basic cases

## Responsive Components

### ResponsiveLayout

Main layout wrapper that automatically switches between desktop sidebar and mobile bottom navigation.

```typescript
import { ResponsiveLayout } from '@/components/layout';

function App() {
  return (
    <ResponsiveLayout>
      <YourPageContent />
    </ResponsiveLayout>
  );
}
```

**Features:**
- Desktop: Sidebar navigation
- Mobile: Bottom navigation bar
- Automatic padding adjustment
- Mobile menu overlay
- Role-based navigation items

### MobileNav

Bottom navigation bar for mobile devices.

```typescript
import { MobileNav } from '@/components/layout';

<MobileNav />
```

**Features:**
- Fixed bottom positioning
- Touch-optimized targets (44x44px minimum)
- Active state indicators
- Role-based menu items
- Icon-based navigation

### Responsive Table

Table component that automatically switches to card view on mobile.

```typescript
import { Table } from '@/components/data-display';

<Table
  data={bookings}
  columns={columns}
  keyExtractor={(row) => row.id}
  pagination
  sortable
/>
```

**Behavior:**
- Desktop: Traditional table layout
- Mobile: Card-based layout
- Touch-friendly pagination
- Optimized spacing for mobile

### MobileCardList

Optimized list component for mobile viewing.

```typescript
import { MobileCardList } from '@/components/data-display';

<MobileCardList
  items={items}
  fields={[
    { 
      key: 'name', 
      label: 'Name', 
      render: (item) => item.name, 
      primary: true 
    },
    { 
      key: 'date', 
      label: 'Date', 
      render: (item) => formatDate(item.date), 
      secondary: true 
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (item) => <Badge>{item.status}</Badge> 
    },
  ]}
  onItemClick={(item) => handleClick(item)}
/>
```

**Features:**
- Primary/secondary field highlighting
- Collapsible detail fields
- Touch-optimized interactions
- Loading states with skeleton screens

### Responsive Modal

Modal component with bottom sheet mode for mobile.

```typescript
import { Modal } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Booking Details"
  mobileBottomSheet={true}
>
  <ModalContent />
</Modal>
```

**Behavior:**
- Desktop: Centered modal
- Mobile: Bottom sheet with slide-up animation
- Drag handle on mobile
- Maximum height constraints (90vh)
- Scrollable content area

### ResponsiveImage

Image component with lazy loading and responsive sizing.

```typescript
import { ResponsiveImage, generateSrcSet } from '@/components/ui';

<ResponsiveImage
  src="/images/campsite.jpg"
  alt="Campsite view"
  aspectRatio="16:9"
  loading="lazy"
  srcSet={generateSrcSet('/images/campsite.jpg')}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

**Features:**
- Lazy loading support
- Responsive sizing with srcSet
- Aspect ratio control
- Placeholder/blur support
- Error handling with fallback
- Loading states

### ResponsiveChart

Chart wrapper with automatic dimension adjustment.

```typescript
import { ResponsiveChart } from '@/components/data-display';

<ResponsiveChart
  mobileHeight={250}
  desktopHeight={400}
>
  <YourChartComponent />
</ResponsiveChart>
```

**Features:**
- Automatic dimension adjustment
- Configurable mobile vs desktop heights
- ResizeObserver for dynamic updates
- Maintains aspect ratio

## Utility Classes

### Touch Target Utilities

Ensure minimum touch target sizes for accessibility.

```css
.touch-target      /* min 44x44px (WCAG 2.1 AA) */
.touch-target-sm   /* min 36x36px */
.touch-target-lg   /* min 48x48px */
```

**Usage:**
```tsx
<button className="touch-target px-4">
  Click Me
</button>
```

### Responsive Text Utilities

Text sizes that scale across breakpoints.

```css
.text-responsive-xs    /* xs → sm */
.text-responsive-sm    /* sm → base */
.text-responsive-base  /* base → lg */
.text-responsive-lg    /* lg → xl */
.text-responsive-xl    /* xl → 2xl */
```

**Usage:**
```tsx
<h1 className="text-responsive-xl font-bold">
  Page Title
</h1>
```

### Responsive Grid Utilities

Pre-configured responsive grid layouts.

```css
.grid-responsive    /* 1 → 2 → 3 columns */
.grid-responsive-2  /* 1 → 2 columns */
.grid-responsive-4  /* 1 → 2 → 4 columns */
```

**Usage:**
```tsx
<div className="grid-responsive gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Visibility Utilities

Control element visibility across breakpoints.

```css
.mobile-only   /* visible only on mobile (< 768px) */
.desktop-only  /* visible only on desktop (>= 1024px) */
.tablet-up     /* visible on tablet and up (>= 768px) */
```

**Usage:**
```tsx
<div className="mobile-only">
  <MobileMenu />
</div>
<div className="desktop-only">
  <DesktopSidebar />
</div>
```

### Spacing Utilities

Responsive padding and margin.

```css
.mobile-padding  /* px-4 py-3 sm:px-6 sm:py-4 */
.mobile-margin   /* mx-4 my-3 sm:mx-6 sm:my-4 */
```

### Safe Area Utilities

Support for devices with notches (iPhone X+).

```css
.safe-area-top
.safe-area-bottom
.safe-area-left
.safe-area-right
.safe-area-inset
```

## Image Optimization

### Image Optimization Utilities

```typescript
import {
  generateSrcSet,
  generateSizes,
  getOptimizedImageUrl,
  getThumbnailUrl,
  compressImage,
  supportsWebP,
  lazyLoadImage,
} from '@/utils/imageOptimization';
```

### Generate Responsive Image Sources

```typescript
// Generate srcSet for responsive images
const srcSet = generateSrcSet('/images/campsite.jpg');
// Returns: "/images/campsite.jpg?w=320 320w, /images/campsite.jpg?w=640 640w, ..."

// Generate sizes attribute
const sizes = generateSizes();
// Returns: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
```

### Optimize Image URLs

```typescript
// Get optimized image URL
const url = getOptimizedImageUrl('/images/campsite.jpg', {
  width: 800,
  height: 600,
  quality: 80,
  format: 'webp',
});
// Returns: "/images/campsite.jpg?w=800&h=600&q=80&f=webp"

// Get thumbnail
const thumb = getThumbnailUrl('/images/campsite.jpg', 200, 150);
// Returns: "/images/campsite.jpg?w=200&h=150&q=70"
```

### Client-Side Image Compression

```typescript
// Compress image before upload
const compressedFile = await compressImage(
  file,           // File object
  1920,           // Max width
  1080,           // Max height
  0.8             // Quality (0-1)
);
```

### Lazy Loading

```typescript
// Lazy load image with Intersection Observer
const cleanup = lazyLoadImage(
  imageElement,
  '/images/campsite.jpg',
  '/images/placeholder.jpg'
);

// Cleanup when component unmounts
return () => cleanup();
```

### Check WebP Support

```typescript
if (supportsWebP()) {
  // Use WebP format
  imageUrl = getOptimizedImageUrl(src, { format: 'webp' });
} else {
  // Fallback to JPEG
  imageUrl = getOptimizedImageUrl(src, { format: 'jpeg' });
}
```

## Best Practices

### 1. Mobile-First Approach

Always start with mobile styles and progressively enhance for larger screens.

```css
/* ✅ Good - Mobile first */
.button {
  @apply px-4 py-2 text-sm;
}
@media (min-width: 768px) {
  .button {
    @apply px-6 py-3 text-base;
  }
}

/* ❌ Bad - Desktop first */
.button {
  @apply px-6 py-3 text-base;
}
@media (max-width: 767px) {
  .button {
    @apply px-4 py-2 text-sm;
  }
}
```

### 2. Touch Target Sizes

Ensure all interactive elements meet minimum touch target sizes (44x44px for WCAG 2.1 AA compliance).

```tsx
// ✅ Good - Minimum 44x44px
<button className="min-h-[44px] min-w-[44px] px-4 py-2">
  Click Me
</button>

// ❌ Bad - Too small for touch
<button className="h-8 w-8 p-1">
  Click
</button>
```

### 3. Conditional Rendering

Use hooks for complex conditional rendering, CSS for simple visibility toggles.

```tsx
// ✅ Good - Use hooks for different components
const isMobile = useIsMobile();
return isMobile ? <MobileView /> : <DesktopView />;

// ✅ Good - Use CSS for simple visibility
<div className="hidden lg:block">Desktop only</div>

// ❌ Bad - Rendering both with CSS (wastes resources)
<div className="block lg:hidden"><MobileView /></div>
<div className="hidden lg:block"><DesktopView /></div>
```

### 4. Responsive Images

Always use responsive images with lazy loading and appropriate formats.

```tsx
// ✅ Good - Responsive with lazy loading
<ResponsiveImage
  src="/images/campsite.jpg"
  srcSet={generateSrcSet('/images/campsite.jpg')}
  sizes="(max-width: 640px) 100vw, 50vw"
  loading="lazy"
  alt="Campsite view"
/>

// ❌ Bad - Single size, no optimization
<img src="/images/campsite.jpg" alt="Campsite" />
```

### 5. Responsive Typography

Use responsive text utilities or Tailwind's responsive classes.

```tsx
// ✅ Good - Scales with screen size
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Page Title
</h1>

// ✅ Good - Using utility class
<h1 className="text-responsive-xl font-bold">
  Page Title
</h1>

// ❌ Bad - Fixed size
<h1 className="text-4xl font-bold">
  Page Title
</h1>
```

### 6. Responsive Spacing

Use responsive spacing utilities for consistent layouts.

```tsx
// ✅ Good - Responsive padding
<div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
  Content
</div>

// ✅ Good - Using utility class
<div className="mobile-padding">
  Content
</div>

// ❌ Bad - Fixed spacing
<div className="px-8 py-6">
  Content
</div>
```

### 7. Responsive Grids

Use responsive grid utilities or Tailwind's grid classes.

```tsx
// ✅ Good - Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// ✅ Good - Using utility class
<div className="grid-responsive gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### 8. Performance Optimization

- Use lazy loading for images and heavy components
- Implement code splitting for routes
- Minimize bundle size with tree shaking
- Use responsive images to reduce bandwidth

```tsx
// Lazy load route components
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const BookingManagement = lazy(() => import('@/pages/BookingManagement'));

// Lazy load images
<ResponsiveImage loading="lazy" src="/image.jpg" />
```

## Testing Guidelines

### Device Testing Checklist

Test on the following device sizes:

- [ ] **iPhone SE** (320px width) - Smallest mobile
- [ ] **iPhone 12/13/14** (390px width) - Standard mobile
- [ ] **iPhone 14 Pro Max** (430px width) - Large mobile
- [ ] **iPad** (768px width) - Tablet portrait
- [ ] **iPad Pro** (1024px width) - Tablet landscape
- [ ] **Desktop** (1280px+ width) - Standard desktop
- [ ] **Large Desktop** (1920px+ width) - Large screens

### Browser Testing

- [ ] Safari (iOS) - Mobile Safari
- [ ] Chrome (Android) - Mobile Chrome
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)
- [ ] Edge (Desktop)

### Interaction Testing

- [ ] Touch targets are minimum 44x44px
- [ ] Swipe gestures work on mobile
- [ ] Orientation changes handled correctly
- [ ] Bottom navigation functions properly
- [ ] Modal bottom sheets work on mobile
- [ ] Tables convert to cards on mobile
- [ ] Images lazy load correctly
- [ ] Charts resize appropriately
- [ ] Forms are usable on mobile
- [ ] Keyboard navigation works

### Performance Testing

- [ ] Images load efficiently on 3G
- [ ] Bundle size is optimized
- [ ] Lazy loading works correctly
- [ ] Animations are smooth (60fps)
- [ ] Touch response time < 100ms
- [ ] No layout shifts (CLS < 0.1)
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s

### Accessibility Testing

- [ ] Touch targets meet WCAG 2.1 AA (44x44px)
- [ ] Text is readable at all sizes
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators are visible
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Zoom up to 200% works

## Common Patterns

### Responsive Container

```tsx
<div className="w-full px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
  {/* Content */}
</div>
```

### Responsive Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      {item.content}
    </Card>
  ))}
</div>
```

### Responsive Form

```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Input label="City" />
    <Input label="State" />
    <Input label="Zip" />
  </div>
  <Button className="w-full md:w-auto">
    Submit
  </Button>
</form>
```

### Responsive Navigation

```tsx
function Navigation() {
  const isMobile = useIsMobile();
  
  return isMobile ? <MobileNav /> : <DesktopSidebar />;
}
```

### Responsive Data Display

```tsx
function DataDisplay({ data }) {
  const isMobile = useIsMobile();
  
  return isMobile ? (
    <MobileCardList items={data} fields={fields} />
  ) : (
    <Table data={data} columns={columns} />
  );
}
```

## Resources

### Documentation
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [WCAG 2.1 Touch Target Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)

### Tools
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)
- [Responsive Design Checker](https://responsivedesignchecker.com/)
- [BrowserStack](https://www.browserstack.com/) - Cross-browser testing

### Related Documentation
- [UI Components Guide](./ui-components.md)
- [Development Setup](./setup.md)
- [Frontend Configuration](../../frontend/CONFIG.md)
- [Responsive Quick Reference](../../frontend/RESPONSIVE_QUICK_REFERENCE.md)

---

*Last updated: 2025-10-14*
