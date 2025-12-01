import { test, expect } from '@playwright/test';

test.describe('production preview smoke test', () => {
  test('login screen renders without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
        console.error(`[console:${message.type()}] ${message.text()}`);
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
      console.error(`[pageerror] ${error.message}\n${error.stack}`);
    });

    await page.goto('/');
    await page.waitForSelector('#root >> xpath=*', {
      timeout: 15_000,
      state: 'attached',
    });

    const hasMountedContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return !!root && root.children.length > 0;
    });

    expect(hasMountedContent).toBe(true);

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
});

