# Map Editor User Guide

This guide covers how to use the interactive map editor to visually design and manage your campsite layout.

## Overview

The Map Editor is a powerful visual tool that allows administrators to:
- Create interactive campsite maps with background images
- Place and position campsites, amenities, and structures
- Drag and drop modules to arrange your layout
- Configure properties for each map element
- Duplicate modules for quick layout creation
- Save and manage multiple campground maps

## Accessing the Map Editor

1. Log in as an Admin user
2. Navigate to **Admin** → **Map Editor** from the sidebar
3. Select an existing map or create a new one

## Creating a New Map

### Step 1: Upload Background Image

1. Click **Create New Map**
2. Enter a map name (e.g., "Main Campground", "North Section")
3. Add a description for reference
4. Upload a background image:
   - Aerial photo of your campground
   - Hand-drawn layout
   - Satellite imagery
   - Supported formats: JPG, PNG, WebP
   - Maximum file size: 10MB
   - Recommended resolution: 2000x2000 pixels or higher

5. Set the scale factor (default: 1.0)
   - Adjust if your image needs to be larger or smaller
   - Scale of 1.0 = original size
   - Scale of 1.5 = 150% of original size

6. Click **Create Map**

### Step 2: Add Modules

Once your map is created, you can start adding modules:

#### Site Modules
Represent individual campsites (tent sites, RV sites, cabins).

1. Click **Add Site** in the module library
2. Click on the map where you want to place the site
3. Configure site properties in the properties panel:
   - Site number (e.g., "A-1", "RV-12")
   - Site type (tent, RV, cabin, group)
   - Capacity (number of guests)
   - Amenities (water, electric, sewer, etc.)
   - Pricing information

#### Amenity Modules
Represent facilities like restrooms, showers, dump stations.

1. Click **Add Amenity** in the module library
2. Click on the map to place the amenity
3. Configure amenity properties:
   - Amenity type (restroom, shower, dump station, etc.)
   - Name/label
   - Operating hours (if applicable)
   - Accessibility features

#### Structure Modules
Represent buildings, landmarks, or other structures.

1. Click **Add Structure** in the module library
2. Click on the map to place the structure
3. Configure structure properties:
   - Structure type (office, store, pavilion, etc.)
   - Name
   - Description
   - Operating hours

## Editing the Map

### Moving Modules

1. Click and drag any module to reposition it
2. Modules snap to a grid for alignment (optional)
3. Release to place the module
4. Changes are saved automatically

### Selecting Modules

- **Single select**: Click on a module
- **Multi-select**: Hold Ctrl/Cmd and click multiple modules
- **Select all**: Press A to select all modules
- **Deselect**: Click on empty space or press Escape

### Resizing Modules

Transform handles appear when a module is selected:

1. **Corner handles**: Drag to resize proportionally from the opposite corner
2. **Edge handles**: Drag to resize along a single axis (width or height)
3. **Shift + drag**: Hold Shift while dragging a corner handle to maintain aspect ratio
4. **Snap to grid**: When enabled, module sizes snap to grid increments
5. **Size display**: Current dimensions are shown during resize
6. **Minimum size**: All modules enforce a 20x20 pixel minimum size

### Rotating Modules

A rotation handle appears above selected modules:

1. Click and drag the rotation handle (circular icon above the module)
2. The module rotates around its center point
3. Current angle is displayed during rotation (0-360 degrees)
4. **Shift + drag**: Hold Shift to snap rotation to 15-degree increments
5. Release to apply the rotation

### Multi-Module Transformations

When multiple modules are selected, a bounding box appears:

1. **Group move**: Drag the bounding box to move all selected modules together
2. **Group resize**: Drag the bounding box handles to scale all modules proportionally
3. **Group rotate**: Use the rotation handle to rotate all modules around the group center
4. **Relative positions**: All modules maintain their relative positions during transformations
5. **Snap to grid**: Group transformations respect snap-to-grid settings

### Editing Module Properties

1. Select a module by clicking on it
2. The properties panel opens on the right
3. Edit any property fields
4. Changes save automatically
5. Click outside or press Escape to close
6. **Double-click**: Double-click a module to quickly open the properties panel

### Copy, Cut, and Paste

Quickly duplicate or move modules:

1. **Copy**: Select module(s) and press Ctrl/Cmd + C
2. **Cut**: Select module(s) and press Ctrl/Cmd + X (removes from map)
3. **Paste**: Press Ctrl/Cmd + V to paste copied/cut modules
4. **Duplicate**: Press Ctrl/Cmd + D to duplicate in place with offset
5. **Unique IDs**: Pasted modules automatically receive new unique IDs
6. **Position offset**: Pasted modules appear 20 pixels offset from originals
7. **Relative positions**: Multiple pasted modules maintain their relative spacing

### Undo and Redo

Easily correct mistakes or experiment with layouts:

1. **Undo**: Press Ctrl/Cmd + Z or click the Undo button
2. **Redo**: Press Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z, or click the Redo button
3. **History limit**: Up to 50 previous states are stored
4. **Tracked actions**: Module add, delete, move, resize, rotate, and property changes
5. **Visual feedback**: Undo/Redo buttons are disabled when unavailable
6. **New actions**: Performing a new action after undo clears the redo history

### Deleting Modules

1. Select the module(s) to delete
2. Press Delete or Backspace key
3. Module is removed from the map
4. **Undo support**: Deleted modules can be restored with Ctrl/Cmd + Z

### Rulers and Measurements

Visual rulers help with precise positioning:

1. **Toggle rulers**: Click the ruler icon or enable in map settings
2. **Horizontal ruler**: Appears along the top edge of the canvas
3. **Vertical ruler**: Appears along the left edge of the canvas
4. **Measurement marks**: Major marks every 100px, minor marks every 20px
5. **Zoom adaptive**: Ruler intervals adjust based on current zoom level
6. **Units**: Measurements are displayed in pixels

## Module Library

The module library contains pre-configured module types:

### Site Types
- **Tent Site**: Basic camping site for tents
- **RV Site**: Site with hookups for RVs
- **Cabin**: Permanent structure with amenities
- **Group Site**: Large site for multiple families

### Amenity Types
- **Restroom**: Bathroom facilities
- **Shower House**: Shower facilities
- **Dump Station**: RV waste disposal
- **Water Fill**: Potable water station
- **Laundry**: Laundry facilities
- **Playground**: Children's play area

### Structure Types
- **Office**: Camp office/check-in
- **Store**: Camp store
- **Pavilion**: Covered gathering area
- **Amphitheater**: Outdoor performance space
- **Parking**: Parking area

## Properties Panel

The properties panel shows detailed information for the selected module:

### Common Properties (All Modules)
- **Position**: X and Y coordinates on the map
- **Label**: Display name on the map
- **Notes**: Internal notes (not visible to customers)

### Site-Specific Properties
- **Site Number**: Unique identifier
- **Site Type**: Tent, RV, cabin, or group
- **Capacity**: Maximum guests
- **Base Price**: Nightly rate
- **Amenities**: Available hookups and features
- **Pet Friendly**: Allow pets
- **ADA Accessible**: Accessibility features
- **Status**: Available, maintenance, or inactive

### Amenity-Specific Properties
- **Amenity Type**: Category of facility
- **Operating Hours**: When facility is open
- **Capacity**: Maximum users (if applicable)
- **Gender**: Male, female, or family (for restrooms)

### Structure-Specific Properties
- **Structure Type**: Category of building
- **Operating Hours**: Business hours
- **Contact Info**: Phone or email (if applicable)

## Map Settings

Access map settings by clicking the gear icon:

### General Settings
- **Map Name**: Change the map name
- **Description**: Update the description
- **Scale**: Adjust the scale factor
- **Grid**: Toggle grid overlay
- **Snap to Grid**: Enable/disable grid snapping

### Background Image
- **Replace Image**: Upload a new background image
- **Opacity**: Adjust image transparency (useful for tracing)
- **Lock Background**: Prevent accidental movement

### Display Options
- **Show Labels**: Display module labels
- **Show Site Numbers**: Display site numbers
- **Color Coding**: Color modules by status or type
- **Zoom Level**: Adjust zoom (25% to 400%)

## Keyboard Shortcuts

Speed up your workflow with comprehensive keyboard shortcuts. Press **?** or **F1** to view the shortcuts dialog anytime.

### Selection
- **V**: Activate select tool
- **A**: Select all modules
- **Escape**: Deselect all modules

### Tools
- **H**: Activate pan/move tool
- **R**: Activate rotate tool
- **S**: Activate scale tool

### Editing
- **Delete** or **Backspace**: Delete selected module(s)
- **Ctrl/Cmd + C**: Copy selected modules to clipboard
- **Ctrl/Cmd + V**: Paste modules from clipboard
- **Ctrl/Cmd + X**: Cut selected modules (copy and delete)
- **Ctrl/Cmd + D**: Duplicate selected modules in place

### History
- **Ctrl/Cmd + Z**: Undo last action
- **Ctrl/Cmd + Y**: Redo action
- **Ctrl/Cmd + Shift + Z**: Redo action (alternative)

### View
- **G**: Toggle grid visibility
- **+** or **=**: Zoom in
- **-**: Zoom out

### File
- **Ctrl/Cmd + S**: Save map

### Help
- **?** or **F1**: Show keyboard shortcuts dialog

### Transform Modifiers
- **Shift + drag corner handle**: Maintain aspect ratio during resize
- **Shift + drag rotation handle**: Snap rotation to 15-degree increments
- **Shift + drag**: Snap to grid when moving modules (if grid is enabled)

## Best Practices

### Planning Your Layout

1. **Start with a good background image**: Use aerial photos or accurate drawings
2. **Plan your sections**: Group similar site types together
3. **Consider traffic flow**: Place amenities near high-traffic areas
4. **Maintain spacing**: Leave adequate space between sites
5. **Mark utilities**: Note water, electric, and sewer line locations

### Organizing Sites

1. **Use consistent numbering**: A-1, A-2, B-1, B-2, etc.
2. **Group by type**: Keep tent sites, RV sites, and cabins in separate areas
3. **Label clearly**: Use descriptive names for amenities and structures
4. **Color code**: Use status colors to quickly identify availability

### Maintaining Accuracy

1. **Update regularly**: Keep the map current with physical changes
2. **Verify positions**: Ensure modules match actual locations
3. **Check properties**: Confirm all site details are accurate
4. **Test bookings**: Verify sites appear correctly in booking system
5. **Review seasonally**: Update for seasonal changes or improvements

### Performance Tips

1. **Optimize images**: Compress background images before upload
2. **Limit modules**: Very large maps (500+ modules) may be slow
3. **Use bulk operations**: Move multiple modules at once
4. **Save frequently**: Auto-save is enabled, but manual saves are instant
5. **Close properties panel**: Hide panel when not editing for better performance

## Integration with Booking System

Maps created in the editor integrate with the booking system:

- **Site availability**: Map shows real-time availability status
- **Booking selection**: Customers can select sites from the map
- **Status updates**: Site status changes reflect on the map
- **Filtering**: Filter map by site type, amenities, or availability

## Troubleshooting

### Image Upload Issues
- **File too large**: Compress image to under 10MB
- **Wrong format**: Convert to JPG or PNG
- **Upload fails**: Check internet connection and try again
- **Image distorted**: Verify image dimensions and aspect ratio

### Module Placement Issues
- **Can't place module**: Ensure you're clicking on the map canvas
- **Module disappears**: Check if it's off the visible canvas area
- **Can't select module**: Try zooming in or clicking directly on the module
- **Modules overlap**: Use arrow keys to nudge modules apart

### Performance Issues
- **Slow loading**: Reduce background image size
- **Laggy dragging**: Close properties panel and reduce zoom
- **Save fails**: Check internet connection and try again
- **Changes not saving**: Refresh page and try again

### Display Issues
- **Blurry image**: Upload higher resolution background image
- **Wrong colors**: Check color coding settings
- **Labels missing**: Enable "Show Labels" in map settings
- **Zoom too far**: Reset zoom to 100%

## Advanced Features

### Custom Module Types

Administrators can create custom module types:

1. Go to **Settings** → **Module Types**
2. Click **Create Custom Type**
3. Define properties and appearance
4. Save and use in map editor

### Map Templates

Save time with map templates:

1. Create a map with common modules
2. Click **Save as Template**
3. Use template when creating new maps
4. Customize as needed

### Export and Import

Share maps between systems:

1. **Export**: Click **Export Map** to download JSON file
2. **Import**: Click **Import Map** and select JSON file
3. Useful for backups or transferring between environments

## Related Features

- [Site Management](./site-management.md) - Managing individual campsite details
- [Booking Management](./booking-management.md) - Handling reservations
- [Maps API Documentation](../api/maps.md) - Technical API reference

## Support

For assistance with the map editor:
- Contact your system administrator
- Email: support@campsite-system.com
- See [Getting Started](./getting-started.md) for general help
