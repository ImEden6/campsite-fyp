import { test, expect } from '@playwright/test';

test.describe('Authentication Flow & Map Interaction', () => {
  test('should allow an admin to login and navigate to the map editor', async ({ page }) => {
    // 1. NAVIGATION
    // Playwright opens a real Chromium browser instance and navigates to the login route
    await page.goto('/login');

    // 2. INTERACTION 
    // It scans the DOM to find elements just like a human would (by placeholder text or element roles)
    await page.getByPlaceholder(/email/i).fill('admin@campsite-test.com');
    await page.getByPlaceholder(/password/i).fill('SecureP@ssw0rd!');
    
    // Simulates a human clicking the submit button
    await page.getByRole('button', { name: /sign in/i }).click();

    // 3. ASSERTION
    // We strictly assert that the application actually redirects to the dashboard after a successful login
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // 4. MAP EDITOR NAVIGATION
    // Navigate from the dashboard to the Fabric.js map editor
    await page.getByRole('link', { name: /Map Editor/i }).click();
    await expect(page).toHaveURL(/.*\/map/);
    
    // Verify the HTML5 canvas layer has effectively mounted
    const canvasElement = page.locator('canvas.upper-canvas');
    await expect(canvasElement).toBeVisible();
  });
});
