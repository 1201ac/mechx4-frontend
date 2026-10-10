import { test, expect } from '@playwright/test';

test.describe('Route Planner E2E', () => {
  test('User can calculate alternate safe routes from Guwahati to Imphal', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@nerlogix.com');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Navigate to Route Planner page
    await page.goto('/planner');
    await expect(page.locator('h1')).toContainText('Alternate Routes & Delay Estimator');

    // 3. Select origin & destination
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();

    // Select Guwahati as origin and Imphal as destination
    const guwahatiVal = await selects.first().locator('option:has-text("Guwahati")').first().getAttribute('value');
    await selects.first().selectOption(guwahatiVal!);

    const imphalVal = await selects.nth(1).locator('option:has-text("Imphal")').first().getAttribute('value');
    await selects.nth(1).selectOption(imphalVal!);

    // 4. Click calculate safe routes
    await page.click('button:has-text("Calculate Safe Routes")');

    // 5. Verify results render
    await expect(page.locator('h2')).toContainText('Available Route Options');
    await expect(page.locator('text=Primary Recommended Route')).toBeVisible();
    await expect(page.locator('text=Segment Breakdown')).toBeVisible();
  });
});
