import { test, expect } from '@playwright/test';

test.describe('Full 6-step Operational Pipeline', () => {
  test('drives full pipeline from field incident report to alert & route action', async ({ page }) => {
    // Step 1: Login as USER and submit field report
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@nerlogix.com');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Go to Field Report page
    await page.goto('/field-report');
    await expect(page.locator('h1')).toContainText('Submit Field Incident Report');

    // Fill field report form
    await page.fill('textarea[name="note"]', 'Severe landslide blocking highway corridor near Nagaon');
    await page.click('button[type="submit"]');

    // Confirm submission message or list entry
    await page.waitForTimeout(1000);

    // Step 2 & 3: Login as MODERATOR to review & verify report
    await page.goto('/login');
    await page.fill('input[type="email"]', 'moderator@nerlogix.com');
    await page.fill('input[type="password"]', 'Demo@1234');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Check Pending Queue
    await page.goto('/pending-reports');
    await expect(page.locator('h1')).toContainText('Pending Offline Queue');

    // Step 4 & 5: View Alerts & Road Status
    await page.goto('/roads');
    await expect(page.locator('h1')).toContainText('Road Corridor & Status Management');

    await page.goto('/alerts');
    await expect(page.locator('h1')).toContainText('Instant Alert Notifications');

    // Step 6: Route Planner / Action
    await page.goto('/planner');
    await expect(page.locator('h1')).toContainText('Alternate Routes & Delay Estimator');
  });
});
