# Site Management Guide

This guide covers how to manage campsites in the Campsite Management System. Site management is available to Admin users.

## Overview

The site management interface allows administrators to:
- View all campsites in a searchable list
- Create new campsites with detailed information
- Edit existing campsite details
- Upload and manage campsite photos
- Configure amenities for each site
- Set pricing and availability rules

## Accessing Site Management

1. Log in as an Admin user
2. Navigate to **Admin** → **Site Management** from the sidebar
3. You'll see the site list with all configured campsites

## Site List

The site list provides an overview of all campsites with:
- Site name and type (tent, RV, cabin, etc.)
- Current status (available, occupied, maintenance)
- Amenities summary
- Quick action buttons (edit, view details)

### Filtering and Search

Use the search bar to find sites by:
- Site name
- Site type
- Amenity keywords

Apply filters to narrow results by:
- Site type (tent, RV, cabin, group)
- Status (available, occupied, maintenance, inactive)
- Amenities (water, electric, sewer, etc.)

## Creating a New Site

1. Click the **Add New Site** button
2. Fill in the required information:
   - **Site Name**: Unique identifier (e.g., "Site A-12", "Cabin 5")
   - **Site Type**: Select from tent, RV, cabin, or group
   - **Description**: Detailed description of the site
   - **Capacity**: Maximum number of guests
   - **Base Price**: Nightly rate in dollars

3. Configure amenities using the amenity selector:
   - Check all amenities available at this site
   - Common amenities: water hookup, electric hookup, sewer, fire pit, picnic table, grill

4. Upload site photos:
   - Drag and drop images or click to browse
   - Recommended: 3-5 high-quality photos
   - First photo becomes the primary image
   - Supported formats: JPG, PNG, WebP
   - Maximum file size: 5MB per image

5. Set additional options:
   - **Pet Friendly**: Allow pets at this site
   - **ADA Accessible**: Site meets accessibility requirements
   - **Status**: Set initial status (usually "available")

6. Click **Save Site** to create the campsite

## Editing an Existing Site

1. Find the site in the site list
2. Click the **Edit** button
3. Modify any fields as needed
4. Update photos:
   - Add new photos
   - Remove existing photos
   - Reorder photos by dragging
5. Click **Save Changes**

## Site Photos

### Uploading Photos

The image upload component supports:
- **Drag and drop**: Drag images directly onto the upload area
- **Click to browse**: Click the upload area to select files
- **Multiple uploads**: Upload multiple images at once
- **Preview**: See thumbnails before saving

### Managing Photos

- **Reorder**: Drag photos to change their order
- **Set primary**: The first photo is the primary image shown in listings
- **Delete**: Click the X button to remove a photo
- **Captions**: Add optional captions to describe each photo

### Photo Guidelines

For best results:
- Use high-resolution images (at least 1200x800 pixels)
- Show the site from multiple angles
- Include photos of amenities and surroundings
- Use good lighting (natural daylight preferred)
- Keep photos current and accurate

## Amenity Configuration

### Available Amenities

The amenity selector includes:

**Hookups**
- Water hookup
- Electric hookup (30 amp, 50 amp)
- Sewer hookup

**Site Features**
- Fire pit
- Picnic table
- Grill/BBQ
- Patio/deck
- Shade structure

**Accessibility**
- ADA accessible
- Paved pad
- Level site

**Nearby Facilities**
- Restrooms nearby
- Showers nearby
- Dump station access
- Laundry facilities

### Selecting Amenities

1. In the site form, scroll to the **Amenities** section
2. Check all amenities available at the site
3. Amenities are grouped by category for easy selection
4. Selected amenities appear in site listings and search filters

## Site Types

### Tent Sites
- Designed for tent camping
- Typically smaller footprint
- May have limited hookups
- Lower base price

### RV Sites
- Accommodate recreational vehicles
- Usually include hookups (water, electric, sewer)
- Larger pad size
- Higher base price

### Cabins
- Permanent structures
- May include beds, kitchenette, bathroom
- Premium pricing
- Require additional maintenance tracking

### Group Sites
- Accommodate multiple families/groups
- Larger capacity
- May have multiple fire pits and tables
- Special booking rules may apply

## Site Status

Sites can have the following statuses:

- **Available**: Ready for booking
- **Occupied**: Currently has an active booking
- **Maintenance**: Temporarily unavailable for repairs
- **Inactive**: Not available for booking (seasonal closure, etc.)

Only sites with "Available" status appear in customer booking searches.

## Best Practices

### Site Information
- Use clear, descriptive site names
- Write detailed descriptions highlighting unique features
- Keep capacity accurate for safety and comfort
- Update pricing seasonally if needed

### Photo Management
- Upload photos when creating the site
- Update photos annually or when site changes
- Remove outdated or poor-quality photos
- Show the site in different seasons if relevant

### Amenity Accuracy
- Only select amenities that are actually available
- Update amenities if site is upgraded
- Be specific about hookup types (30 vs 50 amp)
- Note any amenity limitations in the description

### Maintenance
- Set status to "Maintenance" when work is needed
- Update status back to "Available" when complete
- Keep site information current
- Review and update all sites quarterly

## Troubleshooting

### Photo Upload Issues
- **File too large**: Compress images before uploading
- **Upload fails**: Check internet connection and try again
- **Wrong format**: Convert to JPG or PNG
- **Slow upload**: Upload photos one at a time

### Form Validation Errors
- **Required fields**: All fields marked with * are required
- **Invalid price**: Enter a positive number
- **Duplicate name**: Site names must be unique
- **Invalid capacity**: Enter a number between 1 and 50

## Related Features

- [Map Editor](./map-editor.md) - Visual campsite layout management with interactive drag-and-drop
- [Booking Management](./booking-management.md) - Managing reservations for sites
- [Pricing Rules](./pricing-rules.md) - Advanced pricing configuration

## Support

For assistance with site management:
- Contact your system administrator
- Email: support@campsite-system.com
- See [Getting Started](./getting-started.md) for general help
