# Equipment Management User Guide

This guide explains how to use the equipment rental features in the Campsite Management System.

## Overview

The equipment management system allows you to:
- Browse available camping equipment for rent
- Add equipment to your booking
- Track rental costs and deposits
- Manage equipment inventory (Admin only)
- Check equipment in and out (Staff)

## For Customers

### Browsing Equipment

1. Navigate to the **Equipment Catalog** from your booking page or main menu
2. Use filters to find what you need:
   - **Category**: Tents, sleeping bags, coolers, etc.
   - **Price Range**: Set minimum and maximum daily rates
   - **Availability**: Show only items available for your dates
   - **Search**: Find equipment by name or description

### Adding Equipment to Your Booking

1. Select equipment from the catalog
2. Choose the quantity you need
3. Verify your rental dates match your booking
4. Review the pricing breakdown:
   - Daily/weekly/monthly rate
   - Total rental cost
   - Security deposit required
5. Click **Add to Booking**

The equipment will be added to your booking and included in your total cost.

### Viewing Your Rentals

1. Go to **My Bookings**
2. Select a booking to view details
3. Scroll to the **Equipment Rentals** section
4. See all rented equipment with:
   - Item name and quantity
   - Rental period
   - Total cost
   - Deposit amount
   - Pickup/return status

### Modifying Rentals

You can modify equipment rentals before pickup:

1. Open your booking details
2. Find the equipment rental
3. Click **Modify** or **Remove**
4. Confirm the changes

**Note**: Changes may affect your total booking cost and deposit.

### Equipment Pickup

When you arrive at the campsite:

1. Check in at the office
2. Staff will verify your equipment rentals
3. Inspect each item for damage
4. Sign the equipment checkout form
5. Pay any remaining deposit if not already paid

### Equipment Return

Before checkout:

1. Return all equipment to the office
2. Staff will inspect items for damage
3. Your deposit will be refunded if items are in good condition
4. Any damage fees will be deducted from your deposit

## For Staff

### Checking Equipment Availability

1. Navigate to **Equipment Management**
2. Select an equipment item
3. Click **Check Availability**
4. Enter the date range
5. View available quantity for those dates

### Processing Equipment Checkout

When a customer picks up equipment:

1. Open their booking
2. Go to **Equipment Rentals**
3. For each item, click **Check Out**
4. Verify the quantity
5. Note the condition
6. Have customer sign acknowledgment
7. Mark as **Checked Out**

### Processing Equipment Return

When a customer returns equipment:

1. Open their booking
2. Go to **Equipment Rentals**
3. For each item, click **Check In**
4. Inspect for damage
5. Note the condition
6. If damaged:
   - Document the damage
   - Calculate damage fees
   - Deduct from deposit
7. Mark as **Returned**
8. Process deposit refund

### Low Inventory Alerts

The system will alert you when equipment inventory is low:

1. Check the **Notifications** bell icon
2. Review low inventory warnings
3. Contact admin to order more equipment
4. Update equipment status if items need maintenance

## For Admins

### Adding New Equipment

1. Navigate to **Equipment Management**
2. Click **Add Equipment**
3. Fill in the details:
   - **Name**: Equipment name (e.g., "Coleman 4-Person Tent")
   - **Description**: Detailed description
   - **Category**: Select from dropdown
   - **Quantity**: Total units in inventory
   - **Daily Rate**: Price per day
   - **Weekly Rate**: Price per week (usually discounted)
   - **Monthly Rate**: Price per month (usually discounted)
   - **Deposit**: Security deposit amount
   - **Images**: Upload product photos
   - **Specifications**: Add custom details (capacity, weight, dimensions, etc.)
4. Click **Save**

### Editing Equipment

1. Find the equipment in the list
2. Click **Edit**
3. Update any fields
4. You can also:
   - Change status (Available, Maintenance, Retired)
   - Adjust available quantity
   - Update pricing
5. Click **Save Changes**

### Managing Equipment Categories

Categories help organize equipment:

1. Go to **Equipment Settings**
2. Click **Manage Categories**
3. Add, edit, or remove categories
4. Common categories:
   - Tents
   - Sleeping Bags
   - Coolers
   - Camp Stoves
   - Lanterns & Lighting
   - Chairs & Tables
   - Water Equipment

### Inventory Tracking

Monitor your equipment inventory:

1. Navigate to **Equipment Inventory**
2. View key metrics:
   - Total quantity per item
   - Currently rented
   - Available for rent
   - In maintenance
3. Set low inventory thresholds
4. Receive alerts when stock is low

### Equipment Maintenance

When equipment needs maintenance:

1. Find the equipment item
2. Click **Mark for Maintenance**
3. Reduce available quantity
4. Add maintenance notes
5. When repaired:
   - Update status to **Available**
   - Restore available quantity
   - Add completion notes

### Pricing Strategies

The system supports flexible pricing:

- **Daily Rate**: Standard per-day price
- **Weekly Rate**: Discounted rate for 7+ days (typically 6x daily rate)
- **Monthly Rate**: Discounted rate for 30+ days (typically 20x daily rate)

**Example:**
- Daily: $25
- Weekly: $150 (saves $25)
- Monthly: $500 (saves $250)

The system automatically applies the best rate for the customer's rental period.

### Viewing Rental Reports

Generate reports on equipment usage:

1. Go to **Reports** > **Equipment**
2. Select date range
3. Choose report type:
   - **Rental Revenue**: Income by equipment
   - **Utilization Rate**: How often equipment is rented
   - **Popular Items**: Most frequently rented
   - **Damage Reports**: Items with damage history
4. Export to CSV or PDF

## Tips and Best Practices

### For Customers

- **Book Early**: Popular equipment rents out quickly during peak season
- **Check Specifications**: Verify equipment meets your needs (capacity, size, etc.)
- **Inspect on Pickup**: Note any existing damage to avoid charges
- **Return on Time**: Late returns may incur additional fees
- **Clean Before Return**: Return equipment in good condition to ensure full deposit refund

### For Staff

- **Document Everything**: Take photos of damage, keep detailed notes
- **Be Consistent**: Apply damage policies fairly to all customers
- **Communicate Clearly**: Explain rental terms and deposit policies upfront
- **Check Inventory Daily**: Ensure equipment is ready for next rental
- **Report Issues**: Alert admins immediately about damaged or missing equipment

### For Admins

- **Set Competitive Rates**: Research local rental prices
- **Maintain Quality**: Replace worn equipment promptly
- **Track Utilization**: Invest in popular items, retire unpopular ones
- **Seasonal Adjustments**: Stock up before peak season
- **Clear Policies**: Document damage fees, late return policies, etc.

## Frequently Asked Questions

**Q: Can I add equipment after booking?**  
A: Yes, you can add equipment to an existing booking anytime before your check-in date, subject to availability.

**Q: What if equipment is damaged during my rental?**  
A: Damage fees will be assessed based on the extent of damage and deducted from your deposit. Normal wear and tear is expected.

**Q: Can I extend my equipment rental?**  
A: Yes, contact staff to extend your rental if the equipment is available. Additional charges will apply.

**Q: When will I get my deposit back?**  
A: Deposits are refunded within 3-5 business days after equipment return and inspection, minus any damage fees.

**Q: What if equipment is unavailable for my dates?**  
A: Try adjusting your dates or check back later as availability changes. You can also add yourself to a waitlist.

**Q: Can I rent equipment without a campsite booking?**  
A: Equipment rentals must be associated with a valid campsite booking.

## Related Documentation

- [API Documentation](../api/equipment.md) - Technical API reference for developers
- [Getting Started Guide](./getting-started.md) - General system overview
- [Booking Management](./booking-management.md) - How to manage bookings

## Support

For assistance with equipment rentals:
- **Customers**: Contact campsite office or use in-app support
- **Staff**: Refer to staff training materials or contact your manager
- **Admins**: Contact technical support or refer to API documentation
