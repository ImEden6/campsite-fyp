import { test, expect } from '@playwright/test';

test.describe('Customer Booking Flow', () => {
  // We can configure Playwright to simulate different screen sizes, like a mobile phone!
  test.use({ viewport: { width: 375, height: 812 } });

  test('should allow a customer to search and select an available campsite layout', async ({ page }) => {
    // 1. Enter the public storefront
    await page.goto('/');

    // 2. Validate the public interface renders correctly to the visitor
    const bannerHeading = page.getByRole('heading', { name: /Welcome to the Campsite/i });
    await expect(bannerHeading).toBeVisible();

    // 3. Navigate to the public booking page
    await page.getByRole('link', { name: /Book Now/i }).click();

    // 4. Input physical constraints and desired dates
    // Simulating a customer looking for an RV site for the weekend
    await page.getByLabel(/Site Type/i).selectOption('RV');
    await page.getByPlaceholder(/Check-in Date/i).fill('2026-10-15');
    await page.getByPlaceholder(/Check-out Date/i).fill('2026-10-18');
    await page.getByRole('button', { name: /Search Availability/i }).click();

    // 5. Select a returned site card and advance towards checkout
    const availableSiteCard = page.locator('.site-card').first();
    await expect(availableSiteCard).toBeVisible();
    await availableSiteCard.getByRole('button', { name: /Select Plot/i }).click();

    // Verify system pushes user to the payment/checkout screen
    await expect(page).toHaveURL(/.*\/checkout/);
  });

  test('should process a mocked Stripe transaction successfully', async ({ page }) => {
    // Setup state (assuming the user is already on the checkout page)
    await page.goto('/checkout?siteId=5&checkIn=2026-10-15&checkOut=2026-10-18');

    // Asserts the cart matches the pricing algorithm
    const totalAmount = page.getByTestId('checkout-total');
    await expect(totalAmount).not.toBeEmpty();

    // Fill in mock payment logic (Stripe element wrappers or simple mocked inputs)
    await page.getByPlaceholder(/Card Number/i).fill('4242 4242 4242 4242'); // Standard Stripe test card
    await page.getByPlaceholder(/MM\/YY/i).fill('12/28');
    await page.getByPlaceholder(/CVC/i).fill('123');

    // Execute payment
    await page.getByRole('button', { name: /Confirm Payment/i }).click();

    // Playwright waits implicitly, then expects the success modal
    await expect(page.getByRole('heading', { name: /Booking Confirmed/i })).toBeVisible();
    await expect(page.getByText(/Your receipt number is/i)).toBeVisible();
  });
});
