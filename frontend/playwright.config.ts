// playwright.config.ts
// configures the playwright test runner for the frontend
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const HOST = process.env.PREVIEW_HOST ?? '127.0.0.1';
const PORT = Number(process.env.PREVIEW_PORT ?? 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `npm run preview -- --host ${HOST} --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    cwd: __dirname,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

