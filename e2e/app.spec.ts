import { test, expect } from '@playwright/test';

test.describe('Notebook Studio PWA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application', async ({ page }) => {
    await expect(page.locator('text=ANTIGRAVITY')).toBeVisible();
    await expect(page.locator('text=Studio Core')).toBeVisible();
  });

  test('should have service worker registered', async ({ page }) => {
    const swRegistered = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration().then((reg) => !!reg);
    });
    expect(swRegistered).toBe(true);
  });

  test('should create a new notebook', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('text=Initial Protocol');

    // Find and click create notebook button (adjust selector as needed)
    await page.getByTitle('Create Notebook').click();

    // Handle the prompt dialog
    page.on('dialog', async (dialog) => {
      expect(dialog.type()).toBe('prompt');
      await dialog.accept('Test Notebook');
    });

    // Verify new notebook appears
    await expect(page.locator('text=Test Notebook')).toBeVisible();
  });

  test('should add a text source', async ({ page }) => {
    // Open source panel
    await page.getByTitle('Add Source').click();

    // Fill in text source
    await page.fill('textarea[placeholder*="text"]', 'Test source content');
    await page.fill('input[placeholder*="title"]', 'Test Source');

    // Submit
    await page.getByRole('button', { name: /add/i }).click();

    // Verify source was added
    await expect(page.locator('text=Test Source')).toBeVisible();
  });

  test('should generate a report', async ({ page }) => {
    // Assuming we have sources added
    await page.click('text=REPORT');

    // Click generate button
    await page.getByRole('button', { name: /execute/i }).click();

    // Wait for loading to complete
    await page.waitForSelector('text=Synthesizing', { state: 'hidden' });

    // Verify report was generated
    await expect(page.locator('[data-testid="report-content"]')).toBeVisible();
  });

  test('should work offline', async ({ page, context }) => {
    // First visit to cache assets
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Reload the page
    await page.reload();

    // App should still load
    await expect(page.locator('text=ANTIGRAVITY')).toBeVisible();
  });

  test('should be installable as PWA', async ({ page }) => {
    const manifestUrl = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link?.getAttribute('href');
    });

    expect(manifestUrl).toBe('/manifest.json');

    // Verify manifest is valid
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest).toHaveProperty('name');
    expect(manifest).toHaveProperty('short_name');
    expect(manifest).toHaveProperty('icons');
  });

  test('should persist data across sessions', async ({ page, context }) => {
    // Create a notebook
    await page.getByTitle('Create Notebook').click();
    page.on('dialog', (dialog) => dialog.accept('Persistent Notebook'));

    await expect(page.locator('text=Persistent Notebook')).toBeVisible();

    // Close and reopen
    await page.close();
    const newPage = await context.newPage();
    await newPage.goto('/');

    // Verify data persisted
    await expect(newPage.locator('text=Persistent Notebook')).toBeVisible();
  });

  test('should handle mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify responsive UI
    await expect(page.locator('select')).toBeVisible(); // Mobile view selector
  });
});
