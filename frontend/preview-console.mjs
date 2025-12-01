/* eslint-env node, es2022 */
/* eslint-disable no-console */
// script to preview the console output of the frontend
import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', msg => {
  console.log(`[console:${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', err => {
  console.log(`[pageerror] ${err.message}`);
  if (err.stack) {
    console.log(err.stack);
  }
});
await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await browser.close();
